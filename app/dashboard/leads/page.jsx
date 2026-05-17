"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, UserPlus, TrendingUp, Target, Activity,
  Plus, Upload, X, Tag as TagIcon, List as ListIcon, ChevronRight,
  Phone, MessageSquare, Zap, StickyNote, Pencil, Trash2,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import Modal from "../../../components/dashboard/Modal";
import EmptyState from "../../../components/dashboard/EmptyState";
import { SkeletonList } from "../../../components/dashboard/Skeleton";
import { Field, Input, Select, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

/* ── status (chips suaves com glow) ── */
const STATUS = {
  new:       { label: "Novo",       color: "#3B82F6" },
  contacted: { label: "Contactado", color: "#F59E0B" },
  converted: { label: "Convertido", color: "#00FF88" },
};
const SOURCE_LABEL = { form: "Formulário", whatsapp: "WhatsApp", import: "Importação", manual: "Manual" };

function chip(color) {
  return {
    background: `${color}1a`,
    color,
    borderColor: `${color}40`,
    boxShadow: `0 0 12px -4px ${color}55`,
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }); }
  catch { return "—"; }
}
function relTime(iso) {
  if (!iso) return "—";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)}min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)}h`;
  return `há ${Math.floor(s / 86400)}d`;
}

function AnimatedNumber({ value = 0, suffix = "" }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / 900, 1);
      setN(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  const isFloat = !Number.isInteger(value);
  return <span>{isFloat ? n.toFixed(1) : Math.round(n).toLocaleString("pt-BR")}{suffix}</span>;
}

function Avatar({ name, url, size = 40 }) {
  const [err, setErr] = useState(false);
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  if (url && !err) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-bg2 shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 text-bg font-bold flex items-center justify-center shrink-0"
    >
      {initial}
    </div>
  );
}

/* ════════════════════ PÁGINA ════════════════════ */
export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [lists, setLists] = useState([]);
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState({ type: "all", value: null }); // all | status | source
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("resumo");
  const [openLead, setOpenLead] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openListView, setOpenListView] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [tagInput, setTagInput] = useState("");

  async function patchLead(id, patch) {
    const updated = await api(`/api/leads/${id}`, { method: "PATCH", body: patch }).catch(() => null);
    if (!updated) return;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    setSelected((s) => (s && s.id === id ? { ...s, ...updated } : s));
  }

  async function load() {
    setLoading(true);
    try {
      const [l, ls] = await Promise.all([
        api("/api/leads").catch(() => []),
        api("/api/lists").catch(() => []),
      ]);
      setLeads(Array.isArray(l) ? l : l?.data || []);
      setLists(Array.isArray(ls) ? ls : ls?.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const total = leads.length;
    const novos = leads.filter((l) => l.status === "new").length;
    const conv = leads.filter((l) => l.status === "converted").length;
    const respond = leads.filter((l) => l.status === "contacted" || l.status === "converted").length;
    const taxa = total ? Math.round((respond / total) * 1000) / 10 : 0;
    const ativos = leads.filter((l) => l.status !== "converted").length;
    return [
      { label: "Leads Totais", value: total, suffix: "", icon: Users, color: "#00FF88" },
      { label: "Leads Novos", value: novos, suffix: "", icon: UserPlus, color: "#3B82F6" },
      { label: "Taxa de Resposta", value: taxa, suffix: "%", icon: TrendingUp, color: "#7C3AED" },
      { label: "Conversões", value: conv, suffix: "", icon: Target, color: "#F59E0B" },
      { label: "Leads Ativos", value: ativos, suffix: "", icon: Activity, color: "#00FF88" },
    ];
  }, [leads]);

  const sources = useMemo(() => {
    const m = new Map();
    leads.forEach((l) => { const s = l.source || "form"; m.set(s, (m.get(s) || 0) + 1); });
    return [...m.entries()];
  }, [leads]);

  const allTags = useMemo(() => {
    const m = new Map();
    leads.forEach((l) => (l.tags || []).forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const statusCounts = useMemo(() => ({
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  }), [leads]);

  const filtered = useMemo(() => {
    let out = leads;
    if (seg.type === "status") out = out.filter((l) => l.status === seg.value);
    if (seg.type === "source") out = out.filter((l) => (l.source || "form") === seg.value);
    if (seg.type === "tag") out = out.filter((l) => (l.tags || []).includes(seg.value));
    const term = q.toLowerCase().trim();
    if (term) out = out.filter((l) => [l.name, l.phone, l.interest, l.source].filter(Boolean).join(" ").toLowerCase().includes(term));
    return out;
  }, [q, leads, seg]);

  async function delLead(id) {
    if (!confirm("Remover este lead?")) return;
    await api(`/api/leads/${id}`, { method: "DELETE" });
    setSelected(null);
    load();
  }

  const RailItem = ({ active, onClick, icon: Icon, label, count, dot }) => (
    <button
      onClick={onClick}
      className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all border ${
        active
          ? "bg-primary/10 border-primary/25 text-primary shadow-[0_0_18px_-8px_rgba(0,255,136,0.6)]"
          : "border-transparent text-ink-300 hover:text-ink-100 hover:bg-white/[0.04]"
      }`}
    >
      {dot ? <span className="size-2 rounded-full shrink-0" style={{ background: dot }} />
           : Icon && <Icon className="size-4 shrink-0" />}
      <span className="flex-1 text-left truncate">{label}</span>
      {count != null && (
        <span className={`text-[11px] tabular-nums ${active ? "text-primary" : "text-ink-500"}`}>
          {count.toLocaleString("pt-BR")}
        </span>
      )}
    </button>
  );

  return (
    <>
      <Topbar
        title="Leads"
        subtitle="Central operacional de relacionamento"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpenImport(true)}>
              <Upload className="size-4" /> Importar
            </Button>
            <Button onClick={() => setOpenLead(true)}>
              <Plus className="size-4" /> Novo Lead
            </Button>
          </>
        }
      />

      <div className="px-4 sm:px-6 py-5 space-y-5">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 320, damping: 26 }}
                whileHover={{ y: -3 }}
                className="glass p-4 relative overflow-hidden group"
              >
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${k.color}44, 0 0 28px -10px ${k.color}55` }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="text-[11px] text-ink-400 font-medium">{k.label}</div>
                    <div className="text-2xl font-bold mt-1.5 tabular-nums" style={{ color: k.color }}>
                      {loading ? "—" : <AnimatedNumber value={k.value} suffix={k.suffix} />}
                    </div>
                  </div>
                  <div className="size-8 rounded-lg flex items-center justify-center border shrink-0"
                    style={{ background: `${k.color}14`, borderColor: `${k.color}30` }}>
                    <Icon className="size-4" style={{ color: k.color }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── 3 colunas ── */}
        <div className="grid lg:grid-cols-[230px_1fr] xl:grid-cols-[230px_1fr_340px] gap-4">

          {/* SIDEBAR ESQUERDA */}
          <div className="glass p-3 space-y-5 h-fit lg:sticky lg:top-4">
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Segmentos</div>
              <div className="space-y-1">
                <RailItem active={seg.type === "all"} onClick={() => setSeg({ type: "all", value: null })}
                  icon={Users} label="Todos os Leads" count={leads.length} />
                {Object.entries(STATUS).map(([k, s]) => (
                  <RailItem key={k} active={seg.type === "status" && seg.value === k}
                    onClick={() => setSeg({ type: "status", value: k })}
                    dot={s.color} label={s.label} count={statusCounts[k]} />
                ))}
              </div>
            </div>

            {sources.length > 0 && (
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Origem</div>
                <div className="space-y-1">
                  {sources.map(([s, c]) => (
                    <RailItem key={s} active={seg.type === "source" && seg.value === s}
                      onClick={() => setSeg({ type: "source", value: s })}
                      icon={TagIcon} label={SOURCE_LABEL[s] || s} count={c} />
                  ))}
                </div>
              </div>
            )}

            {allTags.length > 0 && (
              <div>
                <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Tags</div>
                <div className="space-y-1">
                  {allTags.map(([t, c]) => (
                    <RailItem key={t} active={seg.type === "tag" && seg.value === t}
                      onClick={() => setSeg({ type: "tag", value: t })}
                      dot="#7C3AED" label={t} count={c} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Listas</span>
                <button onClick={() => setOpenImport(true)} className="text-ink-500 hover:text-primary">
                  <Plus className="size-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {lists.length === 0 && <div className="px-2 text-[11px] text-ink-600">Nenhuma lista</div>}
                {lists.map((l) => (
                  <RailItem key={l.id} onClick={() => setOpenListView(l)}
                    icon={ListIcon} label={l.name} count={l.total || l.contacts_count || 0} />
                ))}
              </div>
            </div>
          </div>

          {/* ÁREA CENTRAL */}
          <div className="space-y-4 min-w-0">
            {/* Busca premium */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink-500 group-focus-within:text-primary transition-colors" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar lead, telefone, tag ou lista..."
                className="w-full rounded-2xl bg-white/[0.03] border border-white/[0.08] pl-11 pr-4 py-3 text-sm outline-none transition-all
                  focus:border-primary/50 focus:bg-white/[0.05] focus:shadow-[0_0_28px_-10px_rgba(0,255,136,0.5)] placeholder:text-ink-500"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="text-sm text-ink-300">
                <span className="font-semibold text-ink-100">{filtered.length.toLocaleString("pt-BR")}</span> leads
                {seg.type !== "all" && <span className="text-ink-500"> · filtrado</span>}
              </div>
              {seg.type !== "all" && (
                <button onClick={() => setSeg({ type: "all", value: null })}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1">
                  <X className="size-3" /> limpar filtro
                </button>
              )}
            </div>

            {loading ? (
              <SkeletonList rows={6} cols={4} />
            ) : filtered.length === 0 ? (
              leads.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title="Sua base de contatos começa aqui"
                  desc="Importe um Excel/CSV (limpamos duplicatas) ou cadastre manualmente."
                  cta={{ label: "📂 Importar lista", onClick: () => setOpenImport(true) }}
                  secondary={{ label: "+ Adicionar manualmente", onClick: () => setOpenLead(true) }}
                />
              ) : (
                <EmptyState icon="🔍" title="Nenhum lead encontrado"
                  desc="Ajuste a busca ou o segmento selecionado."
                  cta={{ label: "Limpar", onClick: () => { setSeg({ type: "all", value: null }); setQ(""); } }} />
              )
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {filtered.map((l, i) => {
                    const s = STATUS[l.status] || { label: l.status || "—", color: "#94A3B8" };
                    const isSel = selected?.id === l.id;
                    return (
                      <motion.button
                        key={l.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        onClick={() => { setSelected(l); setTab("resumo"); }}
                        className={`w-full text-left flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all group
                          ${isSel
                            ? "bg-primary/[0.06] border-primary/30 shadow-[0_0_24px_-12px_rgba(0,255,136,0.6)]"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]"}`}
                      >
                        <Avatar name={l.name} url={l.avatar_url} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{l.name || "Sem nome"}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0"
                              style={chip(s.color)}
                            >
                              {s.label}
                            </span>
                            {(l.tags || []).slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0" style={chip("#7C3AED")}>
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5 truncate">
                            {l.phone || "—"}
                            {l.interest ? <span className="text-ink-600"> · {l.interest}</span> : null}
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border text-ink-400 border-white/10 bg-white/[0.02]">
                            {SOURCE_LABEL[l.source] || l.source || "Formulário"}
                          </span>
                          <span className="text-[10px] text-ink-600">{relTime(l.last_interaction_at || l.created_at || l.createdAt)}</span>
                        </div>
                        <ChevronRight className="size-4 text-ink-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* PREVIEW DIREITA */}
          <div className="hidden xl:block">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="glass p-5 lg:sticky lg:top-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={selected.name} url={selected.avatar_url} size={48} />
                      <div className="min-w-0">
                        <div className="font-bold truncate">{selected.name || "Sem nome"}</div>
                        <div className="text-xs text-ink-500">{selected.phone || "—"}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-ink-500 hover:text-ink-100">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { Icon: MessageSquare, label: "Conversa", href: "/dashboard/conversas" },
                      { Icon: Zap, label: "Fluxo", href: "/dashboard/workflow" },
                      { Icon: Pencil, label: "Editar", onClick: () => setEditLead(selected) },
                    ].map(({ Icon, label, href, onClick }) => (
                      <a
                        key={label}
                        href={href || undefined}
                        onClick={onClick}
                        className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 text-[11px] text-ink-300 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <Icon className="size-4" />
                        {label}
                      </a>
                    ))}
                  </div>

                  <div className="flex gap-1 mt-4 border-b border-white/[0.06]">
                    {[
                      { k: "resumo", label: "Resumo" },
                      { k: "conversas", label: "Conversas" },
                      { k: "automacao", label: "Automação" },
                      { k: "notas", label: "Notas" },
                    ].map((t) => (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k)}
                        className={`px-2.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                          tab === t.k ? "border-primary text-primary" : "border-transparent text-ink-500 hover:text-ink-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    {tab === "resumo" && (
                      <div className="space-y-3 text-sm">
                        {[
                          ["Origem", SOURCE_LABEL[selected.source] || selected.source || "Formulário"],
                          ["Status", (STATUS[selected.status]?.label) || selected.status || "—"],
                          ["Interesse", selected.interest || "—"],
                          ["Entrada", fmtDate(selected.created_at || selected.createdAt)],
                          ["Última interação", relTime(selected.last_interaction_at || selected.created_at || selected.createdAt)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-3">
                            <span className="text-ink-500 text-xs">{k}</span>
                            <span className="text-ink-100 text-xs font-medium text-right truncate">{v}</span>
                          </div>
                        ))}

                        <div>
                          <div className="text-ink-500 text-xs mb-1.5">Tags</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(selected.tags || []).map((t) => (
                              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1" style={chip("#7C3AED")}>
                                {t}
                                <button
                                  onClick={() => patchLead(selected.id, { tags: (selected.tags || []).filter((x) => x !== t) })}
                                  className="hover:text-white"
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              const v = tagInput.trim();
                              if (e.key === "Enter" && v) {
                                patchLead(selected.id, { tags: [...new Set([...(selected.tags || []), v])] });
                                setTagInput("");
                              }
                            }}
                            placeholder="+ adicionar tag (Enter)"
                            className="mt-2 w-full rounded-lg bg-white/[0.03] border border-white/[0.08] px-2.5 py-1.5 text-xs outline-none focus:border-primary/50"
                          />
                        </div>

                        <div className="pt-2 flex gap-2">
                          <Button variant="ghost" className="flex-1 !py-2 text-xs" onClick={() => setEditLead(selected)}>
                            <Pencil className="size-3.5" /> Editar
                          </Button>
                          <Button variant="ghost" className="!py-2 text-xs !text-red-400" onClick={() => delLead(selected.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {tab === "conversas" && (
                      <PanelEmpty icon={MessageSquare}
                        text="Histórico de conversa centralizado em Conversas."
                        href="/dashboard/conversas" cta="Abrir Conversas" />
                    )}
                    {tab === "automacao" && (
                      <PanelEmpty icon={Zap}
                        text="Nenhuma automação vinculada a este lead ainda."
                        href="/dashboard/workflow" cta="Criar fluxo" />
                    )}
                    {tab === "notas" && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-500 mb-2">
                          <StickyNote className="size-3.5" /> Notas internas (não enviadas ao cliente)
                        </div>
                        <textarea
                          key={selected.id}
                          defaultValue={selected.notes || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (selected.notes || "")) {
                              patchLead(selected.id, { notes: e.target.value });
                            }
                          }}
                          placeholder="Anotações da equipe sobre este lead..."
                          className="w-full min-h-[140px] rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-xs outline-none focus:border-primary/50 resize-none"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass p-8 text-center lg:sticky lg:top-4"
                >
                  <Users className="size-9 mx-auto text-ink-600 mb-3" />
                  <p className="text-sm text-ink-400">Selecione um lead</p>
                  <p className="text-xs text-ink-600 mt-1">os detalhes aparecem aqui</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <LeadModal open={openLead} onClose={() => setOpenLead(false)} onSaved={load} />
      <LeadModal open={!!editLead} onClose={() => setEditLead(null)} initial={editLead} onSaved={load} />
      <ImportModal open={openImport} onClose={() => setOpenImport(false)} onSaved={load} />
      <ListViewModal list={openListView} onClose={() => setOpenListView(null)} />
    </>
  );
}

function PanelEmpty({ icon: Icon, text, href, cta }) {
  return (
    <div className="text-center py-4">
      <Icon className="size-7 mx-auto mb-2 text-ink-600" />
      <p className="text-xs text-ink-500 mb-3">{text}</p>
      <a href={href} className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
        {cta} <ChevronRight className="size-3" />
      </a>
    </div>
  );
}

/* ════════════════════ MODAIS (mantidos da versão anterior) ════════════════════ */
function StatBlock({ label, value, hint, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.03] text-ink-100",
    warn:    "border-yellow-500/25 bg-yellow-500/[0.06] text-yellow-300",
    success: "border-primary/30 bg-primary/[0.08] text-primary",
  };
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight mt-0.5">{value.toLocaleString("pt-BR")}</div>
      {hint && <div className="text-[10px] opacity-60 mt-0.5">{hint}</div>}
    </div>
  );
}

function LeadModal({ open, onClose, initial, onSaved }) {
  const [form, setForm] = useState({ name: "", phone: "", interest: "", status: "new" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        name: initial.name || "", phone: initial.phone || "",
        interest: initial.interest || "", status: initial.status || "new",
      } : { name: "", phone: "", interest: "", status: "new" });
      setErr("");
    }
  }, [open, initial]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (initial?.id) await api(`/api/leads/${initial.id}`, { method: "PATCH", body: form });
      else await api("/api/leads", { method: "POST", body: form });
      onSaved?.(); onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar Lead" : "Novo Lead"}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Telefone *"><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11999999999" /></Field>
        <Field label="Interesse">
          <Select value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })}>
            <option value="">Selecione...</option>
            <option>Plano Básico</option>
            <option>Plano Pro</option>
            <option>Plano Enterprise</option>
            <option>Dúvidas gerais</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="new">Novo</option>
            <option value="contacted">Contactado</option>
            <option value="converted">Convertido</option>
          </Select>
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? "Salvar" : "Adicionar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setName(""); setRows([]); setStats(null); setErr(""); setInfo(""); }
  }, [open]);

  function cleanContacts(parsed) {
    const seen = new Set();
    const valid = [];
    let duplicates = 0, invalid = 0;
    for (const r of parsed) {
      const phone = String(r.NUMERO || "").replace(/\D/g, "");
      if (phone.length < 10) { invalid++; continue; }
      if (seen.has(phone)) { duplicates++; continue; }
      seen.add(phone);
      valid.push({ NOME: String(r.NOME || "").trim() || phone, NUMERO: phone });
    }
    return { valid, duplicates, invalid, total: parsed.length };
  }

  async function readFile(file) {
    if (!file) return;
    setErr(""); setInfo("Lendo arquivo...");
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let parsed = [];
      if (ext === "csv") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) throw new Error("Arquivo vazio");
        const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/"/g, "").toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (ni === -1 || pi === -1) throw new Error("Colunas NOME e NUMERO não encontradas");
        parsed = lines.slice(1).map(l => {
          const c = l.split(/[,;]/).map(x => x.trim().replace(/"/g, ""));
          return { NOME: c[ni] || "", NUMERO: (c[pi] || "").replace(/\D/g, "") };
        }).filter(r => r.NOME && r.NUMERO);
      } else {
        if (!window.XLSX) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!raw.length) throw new Error("Planilha vazia");
        const headers = raw[0].map(h => String(h || "").trim().toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (ni === -1 || pi === -1) throw new Error("Colunas NOME e NUMERO não encontradas");
        parsed = raw.slice(1).filter(r => r[ni] && r[pi]).map(r => ({
          NOME: String(r[ni] || "").trim(),
          NUMERO: String(r[pi] || "").replace(/\D/g, ""),
        }));
      }
      if (!parsed.length) throw new Error("Nenhum contato encontrado no arquivo");
      const result = cleanContacts(parsed);
      if (!result.valid.length) throw new Error("Nenhum contato válido após limpeza (verifique se os números têm DDD)");
      setRows(result.valid);
      setStats(result);
      setInfo("");
      if (!name) setName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    } catch (e) {
      setErr(e.message); setInfo(""); setStats(null); setRows([]);
    }
  }

  async function save() {
    if (!name.trim()) { setErr("Digite um nome para a lista"); return; }
    if (!rows.length) { setErr("Importe um arquivo primeiro"); return; }
    setLoading(true); setErr("");
    try {
      await api("/api/lists", { method: "POST", body: { name: name.trim(), contacts: rows } });
      onSaved?.(); onClose();
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar Lista de Contatos" size="lg">
      <div className="space-y-4">
        <Field label="Nome da Lista">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clientes Janeiro" />
        </Field>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files?.[0]); }}
          className="rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/[0.03] transition-all p-8 text-center cursor-pointer"
        >
          <div className="text-4xl mb-2">📂</div>
          <h4 className="font-semibold">Clique ou arraste o arquivo aqui</h4>
          <p className="text-xs text-ink-500 mt-1">Formato: Excel (.xlsx) ou CSV (.csv)</p>
          <p className="text-xs text-ink-500">Colunas obrigatórias: <strong>NOME</strong> e <strong>NUMERO</strong></p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv"
            onChange={(e) => readFile(e.target.files?.[0])} className="hidden" />
        </div>
        {info && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">{info}</div>}
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        {stats && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Relatório da importação</div>
              <div className="text-[10px] uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">limpeza automática</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBlock label="Importados" value={stats.total} tone="neutral" />
              <StatBlock label="Duplicados" value={stats.duplicates} tone={stats.duplicates > 0 ? "warn" : "neutral"} hint="removidos" />
              <StatBlock label="Válidos" value={stats.valid.length} tone="success" hint="serão salvos" />
            </div>
            {stats.invalid > 0 && <div className="text-xs text-ink-400 mt-2">⚠️ {stats.invalid} número(s) inválido(s) descartado(s)</div>}
            {stats.duplicates > 0 && <div className="text-xs text-ink-400 mt-1">✨ {stats.duplicates} duplicata(s) removida(s)</div>}
          </div>
        )}
        {rows.length > 0 && (
          <div className="rounded-xl border border-white/10 max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] sticky top-0">
                <tr className="text-left text-xs text-ink-500">
                  <th className="px-3 py-2">Nome</th><th className="px-3 py-2">Número</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.slice(0, 30).map((r, i) => (
                  <tr key={i}><td className="px-3 py-1.5">{r.NOME}</td><td className="px-3 py-1.5 font-mono text-xs">{r.NUMERO}</td></tr>
                ))}
                {rows.length > 30 && <tr><td colSpan={2} className="px-3 py-2 text-xs text-ink-500 italic">...e mais {rows.length - 30}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} loading={loading} disabled={!rows.length}>Salvar Lista</Button>
        </div>
      </div>
    </Modal>
  );
}

function ListViewModal({ list, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!list) { setData(null); return; }
    api(`/api/lists/${list.id}`).then(setData).catch(() => {});
  }, [list]);
  if (!list) return null;
  const contacts = data?.contacts || [];
  return (
    <Modal open={!!list} onClose={onClose} title={list.name} size="lg">
      <div className="text-xs text-ink-500 mb-3">{list.total || contacts.length} contatos · importado {fmtDate(list.created_at)}</div>
      <div className="rounded-xl border border-white/10 max-h-[50vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] sticky top-0">
            <tr className="text-left text-xs text-ink-500">
              <th className="px-3 py-2">#</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Número</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {contacts.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5 text-ink-500">{i + 1}</td>
                <td className="px-3 py-1.5">{c.NOME || c.nome || c.name || ""}</td>
                <td className="px-3 py-1.5 font-mono text-xs text-ink-300">{c.NUMERO || c.numero || c.phone || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
