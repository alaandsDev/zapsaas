"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";

/* ─── helpers ─── */
const timeAgo = (iso) => {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d === 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 30) return `${d}d atrás`;
  return `${Math.floor(d / 30)}m atrás`;
};
const initials = (name) => name ? name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() : "?";
const COLUMN_COLORS = ["#00FFAE", "#7C3AED", "#3B82F6", "#F59E0B", "#F87171", "#34D399", "#FB7185", "#38BDF8"];

/* ─── LeadCard ─── */
function LeadCard({ lead, colColor, onDragStart }) {
  const inactive = lead.last_interaction_at
    ? (Date.now() - new Date(lead.last_interaction_at)) > 30 * 86400000
    : true;
  const ago = timeAgo(lead.last_interaction_at);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="group bg-[#0F1929] border border-white/[0.07] rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-white/[0.14] transition-all select-none"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        {lead.avatar_url ? (
          <img src={lead.avatar_url} alt={lead.name} className="size-8 rounded-full object-cover shrink-0 mt-0.5" />
        ) : (
          <div
            className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
            style={{ background: `${colColor}25`, color: colColor, border: `1px solid ${colColor}40` }}
          >
            {initials(lead.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink-100 truncate">{lead.name}</p>
          <p className="text-[11px] text-ink-500 truncate mt-0.5">{lead.phone}</p>
        </div>
      </div>

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {lead.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-ink-400">{t}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.05]">
        <span className="text-[10px] text-ink-600">
          {lead.source === "import" ? "📋 Import" : lead.source === "form" ? "📝 Formulário" : "💬 Chat"}
        </span>
        {ago && (
          <span className={`text-[10px] font-medium ${inactive ? "text-red-400/70" : "text-ink-500"}`}>
            {inactive ? "⚠ " : ""}{ago}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Column ─── */
function Column({ col, onDrop, onDragOver, onDragStart, onRename, onDelete, onAddColumn, isLast }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(col.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef();

  const handleRename = () => {
    if (editName.trim() && editName !== col.name) onRename(col.id, editName.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-2.5 rounded-full shrink-0" style={{ background: col.color }} />
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
              className="bg-white/[0.06] border border-white/20 rounded-lg px-2 py-0.5 text-[13px] font-semibold text-ink-100 outline-none w-full"
              autoFocus
            />
          ) : (
            <h3
              className="text-[13px] font-semibold text-ink-100 truncate cursor-pointer hover:text-white transition-colors"
              onDoubleClick={() => { if (!col.is_default) { setEditing(true); setEditName(col.name); } }}
            >
              {col.name}
            </h3>
          )}
          <span className="text-[11px] text-ink-500 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md shrink-0">
            {col.leads?.length || 0}
          </span>
        </div>
        {!col.is_default && (
          <button
            onClick={() => onDelete(col.id)}
            className="text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-base leading-none ml-1"
            title="Deletar coluna"
          >
            ✕
          </button>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => { setIsDragOver(false); onDrop(e, col.id); }}
        className={`flex-1 min-h-[120px] rounded-2xl border-2 border-dashed transition-all p-2 space-y-2 ${
          isDragOver
            ? "border-opacity-60 bg-white/[0.03]"
            : "border-white/[0.05] bg-white/[0.01]"
        }`}
        style={{ borderColor: isDragOver ? col.color : undefined }}
      >
        <AnimatePresence>
          {(col.leads || []).map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              colColor={col.color}
              onDragStart={onDragStart}
            />
          ))}
        </AnimatePresence>
        {(col.leads || []).length === 0 && !isDragOver && (
          <div className="flex flex-col items-center justify-center h-24 text-ink-600 text-[11px]">
            <span className="text-2xl opacity-30 mb-1">📭</span>
            Arraste leads aqui
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Column Button ─── */
function AddColumnBtn({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7C3AED");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName(""); setOpen(false);
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-72 shrink-0 h-12 rounded-2xl border-2 border-dashed border-white/10 text-ink-500 hover:border-primary/40 hover:text-primary transition-all text-[13px] font-medium flex items-center justify-center gap-2"
    >
      <span className="text-lg">+</span> Nova coluna
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-72 shrink-0 bg-[#0F1929] border border-white/10 rounded-2xl p-4 space-y-3"
    >
      <p className="text-[12px] font-semibold text-ink-300 uppercase tracking-wider">Nova coluna</p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Ex: Em negociação..."
        className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] text-ink-100 outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600"
        autoFocus
      />
      <div>
        <p className="text-[11px] text-ink-500 mb-1.5">Cor</p>
        <div className="flex gap-1.5 flex-wrap">
          {COLUMN_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="size-6 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: color === c ? "white" : "transparent" }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={!name.trim()}
          className="flex-1 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-[12px] font-semibold hover:bg-primary/25 transition-colors disabled:opacity-40">
          Criar
        </button>
        <button onClick={() => setOpen(false)}
          className="px-3 py-2 rounded-xl border border-white/10 text-ink-500 text-[12px] hover:bg-white/[0.05] transition-colors">
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function CRMPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api("/api/crm/columns");
      setColumns(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Drag handlers */
  const handleDragStart = (e, leadId) => {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    if (!draggingId) return;

    // Optimistic update
    setColumns(prev => {
      const next = prev.map(col => ({
        ...col,
        leads: col.leads.filter(l => l.id !== draggingId)
      }));
      const targetCol = next.find(c => c.id === targetColId);
      const movedLead = prev.flatMap(c => c.leads).find(l => l.id === draggingId);
      if (targetCol && movedLead) {
        targetCol.leads = [...targetCol.leads, { ...movedLead, pipeline_column_id: targetColId }];
      }
      return next;
    });

    await api(`/api/crm/leads/${draggingId}/move`, {
      method: "PATCH",
      body: { column_id: targetColId, position: 999 }
    }).catch(() => load()); // revert on error

    setDraggingId(null);
  };

  const handleAddColumn = async (name, color) => {
    await api("/api/crm/columns", { method: "POST", body: { name, color } });
    load();
  };

  const handleRename = async (id, name) => {
    await api(`/api/crm/columns/${id}`, { method: "PATCH", body: { name } });
    setColumns(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar esta coluna? Os leads serão movidos para Novo Lead.")) return;
    await api(`/api/crm/columns/${id}`, { method: "DELETE" });
    load();
  };

  const totalLeads = columns.reduce((s, c) => s + (c.leads?.length || 0), 0);

  return (
    <>
      <Topbar
        title="CRM Pipeline"
        subtitle={`${totalLeads} lead${totalLeads !== 1 ? "s" : ""} no funil`}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 sm:px-6 py-5">
          {/* Kanban board */}
          <div
            className="flex gap-5 overflow-x-auto pb-6"
            style={{ minHeight: "calc(100vh - 160px)" }}
          >
            {columns.map(col => (
              <div key={col.id} className="group">
                <Column
                  col={col}
                  onDragStart={handleDragStart}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            <AddColumnBtn onAdd={handleAddColumn} />
          </div>
        </div>
      )}
    </>
  );
}
