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
import Modal from "../../../components/dashboard/Modal";
import { Field, Input, Select, Textarea, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

const NEON = "#00FF88";
const RANGES = [{ d: 7, label: "7 dias" }, { d: 30, label: "30 dias" }, { d: 90, label: "90 dias" }];
const STATUS = {
  won: { label: "Ganha", color: "#00FF88" },
  pending: { label: "Pendente", color: "#F59E0B" },
  lost: { label: "Perdida", color: "#EF4444" },
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
    { label: "Receita Gerada", money: s.total || 0, delta: s.deltaPct, icon: DollarSign, color: NEON },
    { label: "Vendas", value: s.count || 0, icon: ShoppingBag, color: "#00D1FF" },
    { label: "Ticket Médio", money: s.avgTicket || 0, icon: Receipt, color: "#7C3AED" },
  ];

  return (
    <>
      <Topbar
        title="Vendas"
        subtitle="Receita e negócios fechados"
        actions={
          <>
            <div className="flex gap-0.5 bg-white/[0.03] border border-white/10 rounded-xl p-1">
              {RANGES.map((r) => (
                <button key={r.d} onClick={() => setDays(r.d)}
                  className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${days === r.d ? "text-bg font-semibold" : "text-ink-400 hover:text-ink-100"}`}
                  style={days === r.d ? { background: NEON } : undefined}>
                  {r.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setModal({})} className="shrink-0">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nova venda</span>
            </Button>
          </>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/[0.06] p-5"
                style={{ background: "linear-gradient(160deg,#0B1120,#0F172A)" }}>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-ink-400">{k.label}</div>
                  <div className="size-8 rounded-lg flex items-center justify-center border"
                    style={{ background: `${k.color}16`, borderColor: `${k.color}33` }}>
                    <Icon className="size-4" style={{ color: k.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold mt-3" style={{ color: k.color }}>
                  {loading ? "—" : k.money != null ? <AnimatedMoney value={k.money} /> : (k.value || 0).toLocaleString("pt-BR")}
                </div>
                {k.delta != null && (
                  <div className={`text-[11px] mt-1.5 ${k.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {k.delta >= 0 ? "▲" : "▼"} {Math.abs(k.delta)}% vs. período anterior
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Receita por dia */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] p-5"
          style={{ background: "linear-gradient(160deg,#0B1120,#0F172A)" }}>
          <div className="font-semibold text-sm">Receita no período</div>
          <div className="text-xs text-ink-500 mt-0.5 mb-4">Soma das vendas ganhas por dia</div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.byDay || []} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NEON} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={NEON} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v) => brl(v)}
                  contentStyle={{ background: "rgba(11,17,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#F8FAFC" }}
                  cursor={{ stroke: "rgba(0,255,136,0.3)" }} />
                <Area type="monotone" dataKey="v" name="Receita" stroke={NEON} strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Receita por campanha/fluxo (atribuição real) */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] overflow-hidden"
          style={{ background: "linear-gradient(160deg,#0B1120,#0F172A)" }}>
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="font-semibold text-sm">Receita por campanha / fluxo</div>
            <div className="text-xs text-ink-500 mt-0.5">Atribuição real das vendas ganhas no período</div>
          </div>
          {!roi ? (
            <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-9 bg-white/[0.04] rounded-lg animate-pulse" />)}</div>
          ) : !roi.rows?.length ? (
            <div className="py-12 text-center text-xs text-ink-500">Sem vendas atribuídas neste período</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 600 }}>
                <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-ink-500">
                  <tr className="text-left">
                    <th className="px-5 py-2.5 font-medium min-w-[160px]">Origem</th>
                    <th className="px-3 py-2.5 font-medium min-w-[90px]">Tipo</th>
                    <th className="px-3 py-2.5 font-medium text-right min-w-[80px]">Envios</th>
                    <th className="px-3 py-2.5 font-medium text-right min-w-[60px]">Vendas</th>
                    <th className="px-3 py-2.5 font-medium text-right min-w-[80px]">Conv.</th>
                    <th className="px-5 py-2.5 font-medium text-right min-w-[100px]">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {roi.rows.map((r) => {
                    const tint = r.kind === "campaign" ? "#00D1FF" : r.kind === "flow" ? "#7C3AED" : "#64748B";
                    const tlabel = r.kind === "campaign" ? "Campanha" : r.kind === "flow" ? "Fluxo" : "—";
                    return (
                      <tr key={`${r.kind}-${r.id}`} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium max-w-[200px]">
                          <div className="truncate">{r.name}</div>
                          <div className="text-[10px] text-ink-500 tabular-nums mt-0.5">ticket: {brl(r.avgTicket)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap" style={{ background: `${tint}1a`, color: tint, borderColor: `${tint}40` }}>{tlabel}</span>
                        </td>
                        <td className="px-3 py-3 text-right text-ink-300 tabular-nums">{r.recipients ? r.recipients.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right text-ink-300 tabular-nums">{r.count}</td>
                        <td className="px-3 py-3 text-right text-ink-300 tabular-nums">{r.convRate != null ? `${r.convRate}%` : "—"}</td>
                        <td className="px-5 py-3 text-right font-bold tabular-nums" style={{ color: NEON }}>{brl(r.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Lista */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden"
          style={{ background: "linear-gradient(160deg,#0B1120,#0F172A)" }}>
          <div className="px-5 py-4 border-b border-white/[0.06] font-semibold text-sm">Negócios</div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-white/[0.04] rounded-lg animate-pulse" />)}
            </div>
          ) : !sales.length ? (
            <div className="py-16 text-center">
              <DollarSign className="size-9 mx-auto text-ink-700 mb-2" />
              <p className="text-sm text-ink-400">Nenhuma venda registrada</p>
              <button onClick={() => setModal({})} className="text-xs text-primary font-semibold mt-2 hover:underline">+ Registrar primeira venda</button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {sales.map((v) => {
                const st = STATUS[v.status] || STATUS.won;
                return (
                  <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                    <div className="size-9 rounded-xl flex items-center justify-center border shrink-0"
                      style={{ background: `${st.color}14`, borderColor: `${st.color}30` }}>
                      <DollarSign className="size-4" style={{ color: st.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{v.title || leadName(v.lead_id)}</div>
                      <div className="text-[11px] text-ink-500 truncate">
                        {SOURCE[v.source] || v.source} · {fmtDate(v.closed_at)}
                        {v.lead_id && <span> · {leadName(v.lead_id)}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0"
                      style={{ background: `${st.color}1a`, color: st.color, borderColor: `${st.color}40` }}>
                      {st.label}
                    </span>
                    <div className="text-sm font-bold tabular-nums shrink-0" style={{ color: st.color }}>{brl(v.amount)}</div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(v)} className="size-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-primary hover:bg-white/5" title="Editar"><Pencil className="size-3.5" /></button>
                      {deleteId === v.id ? (
                        <>
                          <button onClick={() => remove(v.id)} className="px-2 h-7 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 transition-colors">Confirmar</button>
                          <button onClick={() => setDeleteId(null)} className="size-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-200"><X className="size-3.5" /></button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteId(v.id)} className="size-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-red-400 hover:bg-red-500/10" title="Excluir"><Trash2 className="size-3.5" /></button>
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
    <Modal open onClose={onClose} title={sale ? "Editar venda" : "Nova venda"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Título"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Plano Pro anual" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$) *"><Input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="497.00" /></Field>
          <Field label="Data"><Input type="date" value={form.closed_at} onChange={(e) => setForm({ ...form, closed_at: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="won">Ganha</option><option value="pending">Pendente</option><option value="lost">Perdida</option>
            </Select>
          </Field>
          <Field label="Origem">
            <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="manual">Manual</option><option value="campaign">Campanha</option><option value="flow">Fluxo</option><option value="integration">Integração</option>
            </Select>
          </Field>
        </div>
        <Field label="Lead vinculado (opcional)">
          <Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
            <option value="">— Nenhum —</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
          </Select>
        </Field>
        <Field label="Atribuir a campanha/fluxo (opcional)" hint="Origem da venda — gera o ROI por campanha. Em branco = atribuição automática se houver lead.">
          <Select value={form.attribution} onChange={(e) => setForm({ ...form, attribution: e.target.value })}>
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
          </Select>
        </Field>
        <Field label="Observação"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="min-h-[70px]" /></Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{sale ? "Salvar" : "Registrar venda"}</Button>
        </div>
      </form>
    </Modal>
  );
}
