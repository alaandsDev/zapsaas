"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  pointerWithin, rectIntersection, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Search, ChevronDown, MoreHorizontal, MessageSquare,
  Phone, CheckSquare, Square, Trash2, Edit2, Check, Clock,
  TrendingUp, DollarSign, Users, Target, BarChart2, Filter,
  Zap, Star, Tag, Calendar, Activity, AlertCircle, ChevronRight,
  Briefcase, Mail, MapPin, User, ArrowRight, RefreshCw,
} from "lucide-react";
import { API_URL, getToken } from "../../../lib/api";
import { useRouter } from "next/navigation";
import { DashButton, DashIconButton, DashBadge, DashTh } from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, SCREEN_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

// ─── helpers ────────────────────────────────────────────────
const ACCENT = SCREEN_ACCENT.crm; // azul #2F80ED
const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v || 0);
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
const scoreColor = (s) => s >= 71 ? DASH_ACCENT.green : s >= 41 ? DASH_ACCENT.amber : DASH_ACCENT.red;
const scoreLabel = (s) => s >= 71 ? "Quente" : s >= 41 ? "Morno" : "Frio";
const initials = (name) => name?.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?";

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── activity icons/labels ───────────────────────────────────
const ACT_META = {
  created:           { icon: User,        label: "Lead criado",         color: DASH_ACCENT.violet },
  stage_change:      { icon: ArrowRight,  label: "Etapa alterada",      color: DASH_ACCENT.blue },
  note:              { icon: Edit2,        label: "Nota",                color: DASH_ACCENT.violet },
  message_sent:      { icon: MessageSquare,label: "Mensagem enviada",   color: DASH_ACCENT.green },
  message_received:  { icon: MessageSquare,label: "Mensagem recebida",  color: DASH_ACCENT.amber },
  campaign_sent:     { icon: Zap,          label: "Campanha enviada",   color: DASH_ACCENT.amber },
  workflow_executed: { icon: Activity,     label: "Workflow executado", color: DASH_ACCENT.blue },
  task_created:      { icon: CheckSquare,  label: "Tarefa criada",      color: DASH_ACCENT.violet },
  task_completed:    { icon: Check,        label: "Tarefa concluída",   color: DASH_ACCENT.green },
  field_updated:     { icon: Edit2,        label: "Campo atualizado",   color: DASH_ACCENT.slate },
};

// ════════════════════════════════════════════════════════════
// LEAD CARD (sortable)
// ════════════════════════════════════════════════════════════
function LeadCard({ lead, onClick, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform .22s cubic-bezier(.16,1,.3,1)",
    opacity: isDragging && !overlay ? 0.3 : 1,
  };
  const sc = lead.score || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick(lead)}
      className="group relative rounded-[14px] border border-dash-border bg-white cursor-pointer select-none touch-none shadow-[0_1px_2px_rgba(10,16,32,.04)] hover:shadow-[0_16px_30px_-22px_rgba(10,16,32,.4)] hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200"
    >
      <div className="p-[13px] space-y-2.5">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          {lead.avatar_url ? (
            <img src={lead.avatar_url} alt={lead.name} className="size-8 rounded-lg object-cover shrink-0 ring-1 ring-dash-border" />
          ) : (
            <div className="size-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ring-dash-border"
              style={{ background: `${scoreColor(sc)}18`, color: scoreColor(sc) }}>
              {initials(lead.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-dash-ink truncate">{lead.name}</p>
            <p className="text-[10px] text-dash-faint truncate">{lead.phone}</p>
          </div>
          {/* WhatsApp icon */}
          <svg className="size-3.5 text-[#25D366] shrink-0 opacity-70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.127 1.526 5.868L0 24l6.3-1.656A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.895 0-3.665-.517-5.19-1.418l-.373-.22-3.862 1.016.98-3.782-.242-.389A9.952 9.952 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>

        {/* Source tag */}
        {lead.source && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-dash-subtle border border-dash-border2 text-dash-muted capitalize">{lead.source}</span>
          </div>
        )}

        {/* Value + Score */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-dash-green" style={{ fontVariantNumeric: "tabular-nums" }}>
            {lead.estimated_value > 0 ? fmt(lead.estimated_value) : "R$ 0"}
          </span>
          <div className="flex items-center gap-1">
            <div className="size-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
              style={{ borderColor: scoreColor(sc), color: scoreColor(sc) }}>
              {sc}
            </div>
          </div>
        </div>

        {/* Tags */}
        {lead.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 2).map(t => (
              <DashBadge key={t} color={ACCENT} dot={false} className="!px-[9px] !py-[3px] !text-[11px]">{t}</DashBadge>
            ))}
            {lead.tags.length > 2 && <span className="text-[9px] text-dash-faint">+{lead.tags.length - 2}</span>}
          </div>
        )}

        {/* Last interaction */}
        {lead.last_interaction_at && (
          <p className="text-[10px] text-dash-faint2">{fmtDate(lead.last_interaction_at)}</p>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STAGE COLUMN (droppable)
// ════════════════════════════════════════════════════════════
const PAGE_SIZE = 50;

function StageColumn({ stage, leads, onLeadClick, onAddLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const totalValue = leads.reduce((s, l) => s + (parseFloat(l.estimated_value) || 0), 0);

  // Reseta a paginação quando a coluna encolhe (ex: filtro/busca)
  useEffect(() => { setVisible(PAGE_SIZE); }, [stage.id]);

  const shown = leads.slice(0, visible);
  const remaining = leads.length - shown.length;

  return (
    <div className="flex flex-col shrink-0 w-[260px] h-full min-h-0 rounded-2xl border border-dash-border2 bg-[#F7F8FA] p-3">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 mb-2 px-0.5">
        <div className="size-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
        <span className="text-[12.5px] font-bold text-dash-ink flex-1 truncate">{stage.name}</span>
        <span className="font-mono text-[10px] text-dash-faint font-semibold">{leads.length}</span>
      </div>
      {totalValue > 0 && (
        <p className="shrink-0 text-[10px] text-dash-faint px-0.5 mb-2">{fmt(totalValue)}</p>
      )}

      {/* Cards area — rola internamente (vertical) */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 overflow-y-auto space-y-2 rounded-xl p-1 transition-colors ${isOver ? "bg-dash-blue/[0.06]" : ""}`}
      >
        <SortableContext items={shown.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {shown.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {remaining > 0 && (
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="w-full py-2 rounded-lg text-[11px] font-medium text-dash-blue bg-dash-blue/10 border border-dash-blue/25 hover:bg-dash-blue/20 transition-colors"
          >
            Carregar mais ({remaining})
          </button>
        )}

        <button
          onClick={() => onAddLead(stage.id)}
          className="w-full flex items-center gap-1.5 justify-center py-2 rounded-lg text-[11px] text-dash-faint hover:text-dash-muted hover:bg-white/60 transition-colors"
        >
          <Plus className="size-3.5" />
          Adicionar lead
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LEAD DETAIL PANEL
// ════════════════════════════════════════════════════════════
function LeadPanel({ lead, stages, onClose, onUpdate, onOpenConversas }) {
  const [tab, setTab] = useState("details");
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...lead });
    setLoading(true);
    Promise.all([
      apiFetch(`/api/crm/leads/${lead.id}/activities`),
      apiFetch(`/api/crm/leads/${lead.id}/tasks`),
    ]).then(([acts, tks]) => {
      setActivities(acts);
      setTasks(tks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [lead.id]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/api/crm/leads/${lead.id}`, { method: "PATCH", body: form });
      onUpdate(updated);
    } catch {} finally { setSaving(false); setEditing(false); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const act = await apiFetch(`/api/crm/leads/${lead.id}/activities`, { method: "POST", body: { type: "note", content: newNote.trim() } });
    setActivities(p => [act, ...p]);
    setNewNote("");
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const task = await apiFetch(`/api/crm/leads/${lead.id}/tasks`, { method: "POST", body: { title: newTask.trim() } });
    setTasks(p => [task, ...p]);
    setNewTask("");
  };

  const toggleTask = async (t) => {
    const updated = await apiFetch(`/api/crm/leads/${lead.id}/tasks/${t.id}`, { method: "PATCH", body: { completed: !t.completed } });
    setTasks(p => p.map(x => x.id === t.id ? updated : x));
    if (!t.completed) {
      setActivities(prev => [{ id: Date.now(), type: "task_completed", content: `Tarefa concluída: ${t.title}`, created_at: new Date().toISOString() }, ...prev]);
    }
  };

  const deleteTask = async (t) => {
    await apiFetch(`/api/crm/leads/${lead.id}/tasks/${t.id}`, { method: "DELETE" });
    setTasks(p => p.filter(x => x.id !== t.id));
  };

  const sc = lead.score || 0;
  const stage = stages.find(s => s.id === lead.pipeline_stage_id);

  const Field = ({ label, value, field, type = "text" }) => (
    <div>
      <p className="text-[10px] text-dash-faint mb-0.5">{label}</p>
      {editing ? (
        <input type={type} value={form[field] || ""} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="dash-input !py-1.5 !text-xs" />
      ) : (
        <p className="text-xs text-dash-ink2">{value || "—"}</p>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 38 }}
      className="fixed right-0 top-0 h-screen w-[360px] z-40 border-l border-dash-border flex flex-col overflow-hidden bg-white shadow-[-16px_0_40px_-24px_rgba(10,16,32,.25)]"
    >
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-dash-border2">
        <div className="flex items-start gap-3 mb-3">
          {lead.avatar_url ? (
            <img src={lead.avatar_url} alt={lead.name} className="size-12 rounded-xl object-cover ring-1 ring-dash-border" />
          ) : (
            <div className="size-12 rounded-xl flex items-center justify-center text-base font-bold ring-1 ring-dash-border"
              style={{ background: `${scoreColor(sc)}18`, color: scoreColor(sc) }}>
              {initials(lead.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-dash-ink truncate">{lead.name}</h2>
            {stage && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mt-1"
                style={{ background: `${stage.color}14`, color: stage.color, border: `1px solid ${stage.color}33` }}>
                {stage.name}
              </span>
            )}
          </div>
          <DashIconButton onClick={onClose} className="shrink-0 mt-0.5">
            <X className="size-4" />
          </DashIconButton>
        </div>
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onOpenConversas(lead.phone)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-dash-blue/10 border border-dash-blue/25 text-dash-blue hover:bg-dash-blue/[0.18] transition-colors">
            <MessageSquare className="size-3.5" />
            Conversa
          </button>
          <button
            onClick={() => setEditing(v => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-dash-subtle border border-dash-border text-dash-muted hover:text-dash-ink hover:border-dash-faint transition-colors">
            <Edit2 className="size-3.5" />
            Editar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-dash-border2">
        {[["details","Detalhes"],["activities","Histórico"],["tasks","Tarefas"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === v ? "text-dash-blue border-b-2 border-dash-blue" : "text-dash-faint hover:text-dash-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "details" && (
          <div className="space-y-5">
            {/* Score */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dash-subtle border border-dash-border2">
              <div className="size-10 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                style={{ borderColor: scoreColor(sc), color: scoreColor(sc) }}>
                {sc}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: scoreColor(sc) }}>{scoreLabel(sc)}</p>
                <div className="w-28 h-1.5 bg-dash-border rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${sc}%`, background: scoreColor(sc) }} />
                </div>
              </div>
            </div>

            {/* Principal */}
            <div>
              <p className="dash-section-label !mb-2">Informações principais</p>
              <div className="space-y-2.5">
                <Field label="Nome" value={lead.name} field="name" />
                <div className="flex items-center gap-1">
                  <div className="flex-1"><Field label="Telefone" value={lead.phone} field="phone" /></div>
                  <a href={`https://wa.me/${lead.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    className="mt-4 p-1.5 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors">
                    <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                  </a>
                </div>
                <Field label="E-mail" value={lead.email} field="email" type="email" />
                <Field label="Cidade" value={lead.city} field="city" />
                <Field label="Origem" value={lead.source} field="source" />
              </div>
            </div>

            {/* Comercial */}
            <div>
              <p className="dash-section-label !mb-2">Comercial</p>
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-dash-faint mb-0.5">Valor estimado</p>
                  {editing ? (
                    <input type="number" value={form.estimated_value || 0}
                      onChange={e => setForm(p => ({ ...p, estimated_value: e.target.value }))}
                      className="dash-input !py-1.5 !text-xs" />
                  ) : (
                    <p className="text-xs font-semibold text-dash-green">{fmt(lead.estimated_value)}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-dash-faint mb-0.5">Etapa</p>
                  <p className="text-xs text-dash-ink2">{stage?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dash-faint mb-0.5">Probabilidade</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-dash-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${sc}%`, background: scoreColor(sc) }} />
                    </div>
                    <span className="text-[10px] text-dash-muted">{sc}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="dash-section-label !mb-2">Tags</p>
              {editing ? (
                <input value={(form.tags || []).join(", ")}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))}
                  placeholder="tag1, tag2, tag3"
                  className="dash-input !py-1.5 !text-xs" />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(lead.tags || []).length > 0
                    ? lead.tags.map(t => (
                      <DashBadge key={t} color={ACCENT} dot={false}>{t}</DashBadge>
                    ))
                    : <p className="text-xs text-dash-faint">Nenhuma tag</p>
                  }
                </div>
              )}
            </div>

            {editing && (
              <div className="flex gap-2 pt-1">
                <DashButton onClick={save} loading={saving} className="flex-1">
                  {saving ? "Salvando..." : "Salvar"}
                </DashButton>
                <DashButton variant="secondary" onClick={() => { setEditing(false); setForm({ ...lead }); }}>
                  Cancelar
                </DashButton>
              </div>
            )}
          </div>
        )}

        {tab === "activities" && (
          <div className="space-y-3">
            {/* Add note */}
            <div className="flex gap-2">
              <input value={newNote} onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Adicionar nota..."
                className="dash-input flex-1" />
              <DashIconButton onClick={addNote} className="!w-auto px-3">
                <Plus className="size-4" />
              </DashIconButton>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-5 border-2 border-dash-blue/30 border-t-dash-blue rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-center text-xs text-dash-faint py-8">Nenhuma atividade ainda</p>
            ) : (
              <div className="space-y-2">
                {activities.map(act => {
                  const meta = ACT_META[act.type] || ACT_META.note;
                  const Icon = meta.icon;
                  return (
                    <div key={act.id} className="flex gap-2.5">
                      <div className="size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}33` }}>
                        <Icon className="size-3" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-dash-faint">{meta.label}</p>
                        <p className="text-xs text-dash-ink2 break-words">{act.content}</p>
                        <p className="text-[10px] text-dash-faint2 mt-0.5">{fmtDate(act.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-3">
            {/* Add task */}
            <div className="flex gap-2">
              <input value={newTask} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
                placeholder="Nova tarefa..."
                className="dash-input flex-1" />
              <DashIconButton onClick={addTask} className="!w-auto px-3">
                <Plus className="size-4" />
              </DashIconButton>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-5 border-2 border-dash-blue/30 border-t-dash-blue rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-center text-xs text-dash-faint py-8">Nenhuma tarefa ainda</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-dash-subtle border border-dash-border2 group/task">
                    <button onClick={() => toggleTask(t)} className="shrink-0 text-dash-faint hover:text-dash-green transition-colors">
                      {t.completed ? <CheckSquare className="size-4 text-dash-green" /> : <Square className="size-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${t.completed ? "line-through text-dash-faint" : "text-dash-ink2"}`}>{t.title}</p>
                      {t.due_date && <p className="text-[10px] text-dash-faint2">{new Date(t.due_date).toLocaleDateString("pt-BR")}</p>}
                    </div>
                    <button onClick={() => deleteTask(t)}
                      className="shrink-0 text-dash-faint2 hover:text-dash-red opacity-0 group-hover/task:opacity-100 transition-all">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// STATS BAR
// ════════════════════════════════════════════════════════════
function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
      {[
        { label: "Total de Leads", value: stats.total, icon: Users, color: DASH_ACCENT.violet },
        { label: "Valor em Pipeline", value: fmt(stats.totalValue), icon: DollarSign, color: DASH_ACCENT.blue },
        { label: "Taxa de Conversão", value: `${stats.convRate}%`, icon: TrendingUp, color: DASH_ACCENT.green },
        { label: "Ticket Médio", value: fmt(stats.avgTicket), icon: Target, color: DASH_ACCENT.amber },
        { label: "Leads Ganhos", value: stats.won, icon: Star, color: DASH_ACCENT.green },
        { label: "Leads Perdidos", value: stats.lostCount, icon: AlertCircle, color: DASH_ACCENT.red },
      ].map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="p-3 rounded-xl border border-dash-border bg-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
              <Icon className="size-3.5" style={{ color }} />
            </div>
            <p className="text-[10px] text-dash-faint truncate">{label}</p>
          </div>
          <p className="text-base font-bold text-dash-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function CRMPage() {
  const router = useRouter();
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeLead, setActiveLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pipeline");
  const [listLimit, setListLimit] = useState(100);
  const [newStageOpen, setNewStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState(DASH_ACCENT.green);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const load = useCallback(async () => {
    try {
      const [s, l, st] = await Promise.all([
        apiFetch("/api/crm/stages"),
        apiFetch("/api/crm/leads"),
        apiFetch("/api/crm/stats"),
      ]);
      setStages(s);
      setLeads(l);
      setStats(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Deep-link ?phone= (vindo de Conversas "Ver no CRM") — abre o lead
  const phoneOpened = useRef(false);
  useEffect(() => {
    if (loading || phoneOpened.current || !leads.length) return;
    const wanted = (new URLSearchParams(window.location.search).get("phone") || "").replace(/\D/g, "");
    if (!wanted) return;
    phoneOpened.current = true;
    const match = leads.find(l => String(l.phone || "").replace(/\D/g, "") === wanted);
    if (match) setSelectedLead(match);
    window.history.replaceState({}, "", window.location.pathname);
  }, [loading, leads]);

  // Move o card em tempo real quando o lead é qualificado automaticamente
  useEffect(() => {
    const handler = (e) => {
      const { lead_id, stage_id } = e.detail || {};
      if (!lead_id || !stage_id) return;
      setLeads(prev => prev.map(l => l.id === lead_id ? { ...l, pipeline_stage_id: stage_id } : l));
    };
    window.addEventListener("wayvo:lead-stage", handler);
    return () => window.removeEventListener("wayvo:lead-stage", handler);
  }, []);

  const leadsForStage = (stageId) => {
    const filtered = leads.filter(l => l.pipeline_stage_id === stageId);
    if (search) return filtered.filter(l =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search)
    );
    return filtered.sort((a, b) => (a.pipeline_position || 0) - (b.pipeline_position || 0));
  };

  const unassigned = leads.filter(l => !l.pipeline_stage_id);

  // ── Drag handlers ────────────────────────────────────────
  // Colisão: pointerWithin é mais confiável para kanban; cai para rectIntersection nos vãos.
  const collisionDetection = useCallback((args) => {
    const pointer = pointerWithin(args);
    return pointer.length > 0 ? pointer : rectIntersection(args);
  }, []);

  const findStageOfLead = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? stages.find(s => s.id === lead.pipeline_stage_id) : null;
  };

  function handleDragStart({ active }) {
    setActiveId(active.id);
    setActiveLead(leads.find(l => l.id === active.id) || null);
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null);
    setActiveLead(null);
    if (!over) return;

    const lead = leads.find(l => l.id === active.id);
    if (!lead) return;

    // over.id pode ser um stage_id ou um lead_id
    let targetStageId = stages.find(s => s.id === over.id)?.id;
    if (!targetStageId) {
      targetStageId = findStageOfLead(over.id)?.id;
    }
    if (!targetStageId || targetStageId === lead.pipeline_stage_id) return;

    const fromStage = stages.find(s => s.id === lead.pipeline_stage_id);
    const toStage = stages.find(s => s.id === targetStageId);

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_stage_id: targetStageId } : l));

    try {
      await apiFetch(`/api/crm/leads/${lead.id}/stage`, {
        method: "PATCH",
        body: { stage_id: targetStageId, from_stage_name: fromStage?.name, to_stage_name: toStage?.name },
      });
      // Atualiza stats
      apiFetch("/api/crm/stats").then(setStats).catch(() => {});
    } catch {
      // Reverter
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, pipeline_stage_id: lead.pipeline_stage_id } : l));
    }
  }

  const handleLeadUpdate = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
    setSelectedLead(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const s = await apiFetch("/api/crm/stages", {
      method: "POST", body: { name: newStageName.trim(), color: newStageColor, position: stages.length },
    });
    setStages(prev => [...prev, s]);
    setNewStageOpen(false);
    setNewStageName("");
  };

  const handleAddLeadToStage = (stageId) => {
    router.push(`/dashboard/leads?new=1&stage=${stageId}`);
  };

  const handleOpenConversas = (phone) => {
    router.push(`/dashboard/conversas?phone=${phone}`);
  };

  const applyTemplate = async () => {
    const next = await apiFetch("/api/crm/stages/template", { method: "POST" });
    setStages(next);
  };

  // ── List view helpers ─────────────────────────────────────
  const filteredLeads = search
    ? leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search))
    : leads;
  const listShown = filteredLeads.slice(0, listLimit);
  useEffect(() => { setListLimit(100); }, [search, tab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dash-bg">
        <div className="size-8 border-2 border-dash-blue/30 border-t-dash-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dash-bg">
      {/* Main */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${selectedLead ? "mr-[360px]" : ""}`}>
        {/* Top bar */}
        <div className="shrink-0 px-6 py-4 border-b border-dash-border2 flex items-center gap-4 bg-dash-card">
          <div className="flex items-center gap-2.5">
            <span style={dashHeaderIconStyle(ACCENT)}><Briefcase width={16} height={16} /></span>
            <div>
              <h1 className="text-xl font-bold text-dash-ink leading-tight">CRM</h1>
              <p className="text-xs text-dash-faint">Pipeline de Vendas</p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-dash-faint" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar leads..."
              className="dash-input pl-9 !py-2 !text-xs w-48" />
          </div>

          {/* Novo lead */}
          <DashButton onClick={() => router.push("/dashboard/leads?new=1")}>
            <Plus className="size-4" />
            Novo lead
          </DashButton>

          <DashIconButton onClick={load}>
            <RefreshCw className="size-4" />
          </DashIconButton>
        </div>

        {/* Sub-tabs */}
        <div className="shrink-0 px-6 flex gap-1 border-b border-dash-border2 bg-dash-card">
          {[["pipeline","Pipeline"],["list","Lista"],["reports","Relatórios"]].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`py-3 px-4 text-sm font-medium transition-colors ${tab === v ? "text-dash-blue border-b-2 border-dash-blue" : "text-dash-faint hover:text-dash-muted"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {tab === "pipeline" && leads.length === 0 && (
            <div className="flex-1 min-h-0 overflow-auto p-6">
              <div className="dash-empty">
                <span className="mx-auto mb-4 flex items-center justify-center" style={{ width: 52, height: 52, ...dashHeaderIconStyle(ACCENT), borderRadius: 16 }}>
                  <Briefcase width={24} height={24} />
                </span>
                <h3 className="m-0 text-base font-semibold text-dash-ink">Seu pipeline está vazio</h3>
                <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-relaxed text-dash-faint">
                  Importe seus contatos ou adicione um lead para começar a organizar suas vendas no funil.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <DashButton onClick={() => router.push("/dashboard/leads")}>Importar contatos</DashButton>
                  <DashButton variant="secondary" onClick={() => router.push("/dashboard/leads?new=1")}>+ Adicionar lead</DashButton>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-xs text-dash-faint bg-white border border-dash-border rounded-full px-3 py-1.5">
                  <span>💡</span>
                  <span>Os leads entram em &quot;Novo Lead&quot; e avançam no funil conforme você conversa com o cliente.</span>
                </div>
              </div>
            </div>
          )}
          {tab === "pipeline" && leads.length > 0 && (
            <div className="flex-1 min-h-0 flex flex-col p-6">
              <div className="shrink-0"><StatsBar stats={stats} /></div>
              <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-2 flex-1 min-h-0">
                  {stages.map(stage => (
                    <StageColumn
                      key={stage.id}
                      stage={stage}
                      leads={leadsForStage(stage.id)}
                      onLeadClick={setSelectedLead}
                      onAddLead={handleAddLeadToStage}
                    />
                  ))}

                  {/* Add stage button */}
                  <div className="shrink-0 w-[260px]">
                    {newStageOpen ? (
                      <div className="p-3 rounded-2xl border border-dash-border2 bg-[#F7F8FA] space-y-2">
                        <input value={newStageName} onChange={e => setNewStageName(e.target.value)}
                          placeholder="Nome da etapa..."
                          autoFocus
                          onKeyDown={e => e.key === "Enter" && handleAddStage()}
                          className="dash-input !py-1.5 !text-xs !bg-white" />
                        <div className="flex items-center gap-2">
                          <input type="color" value={newStageColor} onChange={e => setNewStageColor(e.target.value)}
                            className="size-7 rounded-lg cursor-pointer bg-transparent border border-dash-border" />
                          <DashButton onClick={handleAddStage} className="flex-1 !py-1.5">
                            Criar
                          </DashButton>
                          <button onClick={() => setNewStageOpen(false)} className="text-dash-faint hover:text-dash-muted">
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button onClick={() => setNewStageOpen(true)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#DDE2E9] text-xs text-dash-faint hover:text-dash-muted hover:border-dash-faint transition-colors">
                          <Plus className="size-4" />
                          Nova etapa
                        </button>
                        {stages.length <= 1 && (
                          <button onClick={applyTemplate}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dash-blue/30 bg-dash-blue/[0.08] text-xs font-medium text-dash-blue hover:bg-dash-blue/[0.15] transition-colors">
                            <Zap className="size-4" />
                            Usar funil modelo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drag overlay */}
                <DragOverlay>
                  {activeLead && <LeadCard lead={activeLead} onClick={() => {}} overlay />}
                </DragOverlay>
              </DndContext>
            </div>
          )}

          {tab === "list" && (
            <div className="flex-1 min-h-0 overflow-auto p-6">
              <StatsBar stats={stats} />
              <div className="dash-card-flush">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-dash-border2 bg-dash-subtle">
                      {["Lead","Telefone","Etapa","Score","Valor","Origem","Última interação"].map(h => (
                        <th key={h} className="text-left p-0"><DashTh>{h}</DashTh></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {listShown.map(lead => {
                      const stage = stages.find(s => s.id === lead.pipeline_stage_id);
                      const sc = lead.score || 0;
                      return (
                        <tr key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="border-b border-dash-border2 hover:bg-dash-subtle cursor-pointer transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {lead.avatar_url ? (
                                <img src={lead.avatar_url} alt={lead.name} className="size-7 rounded-lg object-cover" />
                              ) : (
                                <div className="size-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                                  style={{ background: `${scoreColor(sc)}18`, color: scoreColor(sc) }}>
                                  {initials(lead.name)}
                                </div>
                              )}
                              <span className="font-medium text-dash-ink">{lead.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-dash-muted">{lead.phone}</td>
                          <td className="px-4 py-3">
                            {stage ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{ background: `${stage.color}14`, border: `1px solid ${stage.color}33`, color: stage.color }}>
                                {stage.name}
                              </span>
                            ) : <span className="text-dash-faint">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: scoreColor(sc) }}>{sc}</span>
                          </td>
                          <td className="px-4 py-3 text-dash-ink2">{lead.estimated_value > 0 ? fmt(lead.estimated_value) : "—"}</td>
                          <td className="px-4 py-3 text-dash-faint capitalize">{lead.source || "—"}</td>
                          <td className="px-4 py-3 text-dash-faint2">{fmtDate(lead.last_interaction_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredLeads.length === 0 && (
                  <p className="text-center text-xs text-dash-faint py-12">Nenhum lead encontrado</p>
                )}
                {filteredLeads.length > listShown.length && (
                  <button
                    onClick={() => setListLimit(v => v + 100)}
                    className="w-full py-3 text-xs font-medium text-dash-blue bg-dash-blue/[0.06] hover:bg-dash-blue/10 transition-colors border-t border-dash-border2"
                  >
                    Carregar mais ({filteredLeads.length - listShown.length} restantes)
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === "reports" && stats && (
            <div className="flex-1 min-h-0 overflow-auto p-6 space-y-6">
              <StatsBar stats={stats} />
              {/* Leads por Etapa */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="dash-card !p-5">
                  <h3 className="text-sm font-semibold text-dash-ink mb-4">Leads por Etapa</h3>
                  <div className="space-y-3">
                    {stats.byStage.map(s => (
                      <div key={s.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs text-dash-ink2">{s.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-dash-ink">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-dash-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dash-card !p-5">
                  <h3 className="text-sm font-semibold text-dash-ink mb-4">Valor por Etapa</h3>
                  <div className="space-y-3">
                    {stats.byStage.filter(s => s.value > 0).sort((a,b) => b.value - a.value).map(s => (
                      <div key={s.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs text-dash-ink2">{s.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-dash-green">{fmt(s.value)}</span>
                        </div>
                        <div className="h-1.5 bg-dash-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${stats.totalValue > 0 ? (s.value / stats.totalValue) * 100 : 0}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                    {stats.byStage.every(s => s.value === 0) && (
                      <p className="text-xs text-dash-faint text-center py-4">Nenhum valor estimado cadastrado</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead detail panel */}
      <AnimatePresence>
        {selectedLead && (
          <LeadPanel
            lead={selectedLead}
            stages={stages}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleLeadUpdate}
            onOpenConversas={handleOpenConversas}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
