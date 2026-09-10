"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  DollarSign, ShoppingBag, Receipt, Plus, Pencil, Trash2, X,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import {
  DashButton, DashIconButton, DashBadge, DashPageHeader, DashTh,
  DashEmptyState, DashSkeletonBar, DashSkeletonStats, DashModal,
} from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

const ACCENT = DASH_ACCENT.green;
const RANGES = [{ d: 7, label: "7 dias" }, { d: 30, label: "30 dias" }, { d: 90, label: "90 dias" }];
const STATUS = {
  won: { label: "Ganha", color: DASH_ACCENT.green },
  pending: { label: "Pendente", color: DASH_ACCENT.amber },
  lost: { label: "Perdida", color: DASH_ACCENT.red },
};
const SOURCE = { manual: "Manual", campaign: "Campanha", flow: "Fluxo", integration: "Integração" };

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }); }
  catch { return "—"; }
}

function AnimatedMoney({ value = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 900, 1);
      setN(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{brl(n)}</span>;
}

export default function VendasPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [leads, setLeads] = useState([]);
  const [roi, setRoi] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [modal,      setModal]      = useState(null);  // null | {} | sale
  const [deleteId,   setDeleteId]   = useState(null);  // id pendente de confirmação

  const load = useCallback(() => {
    api(`/api/sales/summary?days=${days}`).then(setSummary).catch(() => setSummary({}));
    api(`/api/sales/roi?days=${days}`).then(setRoi).catch(() => setRoi({ rows: [] }));
    api("/api/sales").then((s) => setSales(Array.isArray(s) ? s : [])).catch(() => setSales([]));
  }, [days]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api("/api/leads").then((l) => setLeads(Array.isArray(l) ? l : [])).catch(() => {});
    api("/api/dispatches").then((d) => setDispatches(Array.isArray(d) ? d : d?.data || [])).catch(() => {});
    api("/api/workflows").then((w) => setWorkflows(Array.isArray(w) ? w : [])).catch(() => {});
  }, []);

  const leadName = useMemo(() => {
    const m = new Map(leads.map((l) => [l.id, l.name || l.phone]));
    return (id) => m.get(id) || "—";
  }, [leads]);

  async function remove(id) {
    await api(`/api/sales/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const loading = summary === null || sales === null;
  const s = summary || {};
  const kpis = [
    { label: "Receita Gerada", money: s.total || 0, delta: s.deltaPct, icon: DollarSign, highlight: true },
    { label: "Vendas", value: s.count || 0, icon: ShoppingBag },
    { label: "Ticket Médio", money: s.avgTicket || 0, icon: Receipt },
  ];

  return (
    <>
      <Topbar
        title="Vendas"
        subtitle="Receita e negócios fechados"
        actions={
          <>
            <div className="flex gap-0.5 bg-dash-subtle border border-dash-border rounded-xl p-1">
              {RANGES.map((r) => (
                <button key={r.d} onClick={() => setDays(r.d)}
                  className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${days === r.d ? "bg-white text-dash-ink font-semibold shadow-sm" : "text-dash-faint hover:text-dash-ink2"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <DashButton onClick={() => setModal({})} className="shrink-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nova venda</span>
            </DashButton>
          </>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
        {/* KPIs */}
        {loading ? (
          <DashSkeletonStats count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="dash-card">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-dash-faint">{k.label}</div>
                    <span style={dashHeaderIconStyle(ACCENT)}>
                      <Icon width={16} height={16} />
                    </span>
                  </div>
                  <div className={`text-2xl font-bold mt-3 ${k.highlight ? "" : "text-dash-ink"}`} style={k.highlight ? { color: ACCENT } : undefined}>
                    {k.money != null ? <AnimatedMoney value={k.money} /> : (k.value || 0).toLocaleString("pt-BR")}
                  </div>
                  {k.delta != null && (
                    <div className={`text-[11px] mt-1.5 font-medium`} style={{ color: k.delta >= 0 ? DASH_ACCENT.green : DASH_ACCENT.red }}>
                      {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}% vs. período anterior
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Receita por dia */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="dash-card">
          <div className="font-semibold text-sm text-dash-ink">Receita no período</div>
          <div className="text-xs text-dash-faint mt-0.5 mb-4">Soma das vendas ganhas por dia</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.byDay || []} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF3" vertical={false} />
                <XAxis dataKey="d" stroke="#8A94A6" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => brl(v)}
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #E9ECF1", borderRadius: 12, fontSize: 12, color: "#0A1020", boxShadow: "0 8px 24px -8px rgba(10,16,32,0.12)" }}
                  cursor={{ stroke: `${ACCENT}40` }} />
                <Area type="monotone" dataKey="v" name="Receita" stroke={ACCENT} strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Receita por campanha/fluxo (atribuição real) */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="dash-card-flush">
          <div className="px-5 py-4 border-b border-dash-border2">
            <div className="font-semibold text-sm text-dash-ink">Receita por campanha / fluxo</div>
            <div className="text-xs text-dash-faint mt-0.5">Atribuição real das vendas ganhas no período</div>
          </div>
          {!roi ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <DashSkeletonBar key={i} h="36px" />)}</div>
          ) : !roi.rows?.length ? (
            <DashEmptyState icon={DollarSign} accent={ACCENT} title="Sem vendas atribuídas" desc="Nenhuma venda atribuída a campanha ou fluxo neste período." className="rounded-none border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 600 }}>
                <thead className="bg-dash-subtle">
                  <tr className="text-left">
                    <th className="min-w-[160px]"><DashTh>Origem</DashTh></th>
                    <th className="min-w-[90px]"><DashTh>Tipo</DashTh></th>
                    <th className="min-w-[80px]"><DashTh right>Envios</DashTh></th>
                    <th className="min-w-[60px]"><DashTh right>Vendas</DashTh></th>
                    <th className="min-w-[80px]"><DashTh right>Conv.</DashTh></th>
                    <th className="min-w-[100px]"><DashTh right>Receita</DashTh></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border2">
                  {roi.rows.map((r) => {
                    const tint = r.kind === "campaign" ? DASH_ACCENT.blue : r.kind === "flow" ? DASH_ACCENT.violet : DASH_ACCENT.slate;
                    const tlabel = r.kind === "campaign" ? "Campanha" : r.kind === "flow" ? "Fluxo" : "—";
                    return (
                      <tr key={`${r.kind}-${r.id}`} className="hover:bg-dash-subtle transition-colors">
                        <td className="px-5 py-3 font-medium max-w-[200px] text-dash-ink">
                          <div className="truncate">{r.name}</div>
                          <div className="text-[10px] text-dash-faint tabular-nums mt-0.5">ticket: {brl(r.avgTicket)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <DashBadge color={tint}>{tlabel}</DashBadge>
                        </td>
                        <td className="px-3 py-3 text-right text-dash-muted tabular-nums">{r.recipients ? r.recipients.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right text-dash-muted tabular-nums">{r.count}</td>
                        <td className="px-3 py-3 text-right text-dash-muted tabular-nums">{r.convRate != null ? `${r.convRate}%` : "—"}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums" style={{ color: ACCENT }}>{brl(r.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Lista */}
        <div className="dash-card-flush">
          <div className="px-5 py-4 border-b border-dash-border2 font-semibold text-sm text-dash-ink">Negócios</div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <DashSkeletonBar key={i} h="40px" />)}
            </div>
          ) : !sales.length ? (
            <DashEmptyState
              icon={DollarSign} accent={ACCENT}
              title="Nenhuma venda registrada"
              desc="Registre sua primeira venda para começar a acompanhar a receita."
              cta={{ label: "Registrar primeira venda", icon: Plus, onClick: () => setModal({}) }}
              className="rounded-none border-0"
            />
          ) : (
            <div className="divide-y divide-dash-border2">
              {sales.map((v) => {
                const st = STATUS[v.status] || STATUS.won;
                return (
                  <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-dash-subtle transition-colors group">
                    <span className="shrink-0" style={dashHeaderIconStyle(st.color)}>
                      <DollarSign width={16} height={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-dash-ink">{v.title || leadName(v.lead_id)}</div>
                      <div className="text-[11px] text-dash-faint truncate">
                        {SOURCE[v.source] || v.source} · {fmtDate(v.closed_at)}
                        {v.lead_id && <span> · {leadName(v.lead_id)}</span>}
                      </div>
                    </div>
                    <DashBadge color={st.color} className="shrink-0">{st.label}</DashBadge>
                    <div className="text-sm font-bold tabular-nums shrink-0" style={{ color: st.color }}>{brl(v.amount)}</div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DashIconButton onClick={() => setModal(v)} title="Editar"><Pencil width={14} height={14} /></DashIconButton>
                      {deleteId === v.id ? (
                        <>
                          <button onClick={() => remove(v.id)} className="px-2 h-[30px] rounded-[10px] text-[10px] font-semibold text-white bg-dash-red hover:opacity-90 transition-opacity">Confirmar</button>
                          <DashIconButton onClick={() => setDeleteId(null)}><X width={14} height={14} /></DashIconButton>
                        </>
                      ) : (
                        <DashIconButton onClick={() => setDeleteId(v.id)} title="Excluir" className="hover:!text-dash-red hover:!border-dash-red/40"><Trash2 width={14} height={14} /></DashIconButton>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <SaleModal sale={modal.id ? modal : null} leads={leads} dispatches={dispatches} workflows={workflows} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        )}
      </AnimatePresence>
    </>
  );
}

function DashField({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-dash-ink2 mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-dash-faint mt-1.5">{hint}</span>}
    </label>
  );
}

function SaleModal({ sale, leads, dispatches = [], workflows = [], onClose, onSaved }) {
  const [form, setForm] = useState({
    title: sale?.title || "",
    amount: sale?.amount ?? "",
    status: sale?.status || "won",
    source: sale?.source || "manual",
    lead_id: sale?.lead_id || "",
    note: sale?.note || "",
    closed_at: (sale?.closed_at || new Date().toISOString()).slice(0, 10),
    attribution: sale?.dispatch_id ? `c:${sale.dispatch_id}` : sale?.workflow_id ? `f:${sale.workflow_id}` : "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const { attribution, ...rest } = form;
      const body = { ...rest, amount: Number(form.amount), lead_id: form.lead_id || null };
      if (attribution.startsWith("c:")) { body.dispatch_id = attribution.slice(2); body.workflow_id = null; if (form.source === "manual") body.source = "campaign"; }
      else if (attribution.startsWith("f:")) { body.workflow_id = attribution.slice(2); body.dispatch_id = null; if (form.source === "manual") body.source = "flow"; }
      else { body.dispatch_id = null; body.workflow_id = null; }
      if (sale?.id) await api(`/api/sales/${sale.id}`, { method: "PATCH", body });
      else await api("/api/sales", { method: "POST", body });
      onSaved();
    } catch (e) { setErr(e.message || "Falha ao salvar"); } finally { setLoading(false); }
  }

  return (
    <DashModal
      open
      onClose={onClose}
      title={sale ? "Editar venda" : "Nova venda"}
      footer={
        <>
          <DashButton type="button" variant="secondary" onClick={onClose}>Cancelar</DashButton>
          <DashButton type="submit" form="sale-form" loading={loading}>{sale ? "Salvar" : "Registrar venda"}</DashButton>
        </>
      }
    >
      <form id="sale-form" onSubmit={submit} className="space-y-4">
        <DashField label="Título"><input className="dash-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Plano Pro anual" /></DashField>
        <div className="grid grid-cols-2 gap-3">
          <DashField label="Valor (R$) *"><input className="dash-input" required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="497.00" /></DashField>
          <DashField label="Data"><input className="dash-input" type="date" value={form.closed_at} onChange={(e) => setForm({ ...form, closed_at: e.target.value })} /></DashField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DashField label="Status">
            <select className="dash-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="won">Ganha</option><option value="pending">Pendente</option><option value="lost">Perdida</option>
            </select>
          </DashField>
          <DashField label="Origem">
            <select className="dash-input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="manual">Manual</option><option value="campaign">Campanha</option><option value="flow">Fluxo</option><option value="integration">Integração</option>
            </select>
          </DashField>
        </div>
        <DashField label="Lead vinculado (opcional)">
          <select className="dash-input" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
            <option value="">— Nenhum —</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
          </select>
        </DashField>
        <DashField label="Atribuir a campanha/fluxo (opcional)" hint="Origem da venda — gera o ROI por campanha. Em branco = atribuição automática se houver lead.">
          <select className="dash-input" value={form.attribution} onChange={(e) => setForm({ ...form, attribution: e.target.value })}>
            <option value="">— Automático / nenhum —</option>
            {dispatches.length > 0 && (
              <optgroup label="Campanhas">
                {dispatches.map((d) => <option key={d.id} value={`c:${d.id}`}>{d.message_title || "Campanha"}</option>)}
              </optgroup>
            )}
            {workflows.length > 0 && (
              <optgroup label="Fluxos">
                {workflows.map((w) => <option key={w.id} value={`f:${w.id}`}>{w.name || "Fluxo"}</option>)}
              </optgroup>
            )}
          </select>
        </DashField>
        <DashField label="Observação"><textarea className="dash-input min-h-[70px]" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></DashField>
        {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/20 rounded-xl px-4 py-3">{err}</div>}
      </form>
    </DashModal>
  );
}
