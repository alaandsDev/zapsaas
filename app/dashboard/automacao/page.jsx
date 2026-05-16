"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import Modal from "../../../components/dashboard/Modal";

const NODE_TEMPLATES = [
  { name: "Atendimento Inicial", desc: "Boas-vindas + menu de opções", icon: "👋", nodes: 4, color: "#00ffb2" },
  { name: "Recuperação de Carrinho", desc: "Sequência de follow-up automático", icon: "🛒", nodes: 6, color: "#6366f1" },
  { name: "Qualificação de Lead", desc: "Perguntas + condições + tags", icon: "🎯", nodes: 5, color: "#f59e0b" },
  { name: "Pós-venda", desc: "Satisfação + upsell automático", icon: "⭐", nodes: 4, color: "#10b981" },
];

const STATUS_COLORS = {
  true: { label: "Ativo", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  false: { label: "Inativo", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25" },
};

export default function AutomacaoPage() {
  const router = useRouter();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteFlow, setDeleteFlow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try { setFlows(await api("/api/flows")); } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createFlow(template = null) {
    const name = template?.name || createName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const flow = await api("/api/flows", {
        method: "POST",
        body: {
          name,
          description: template?.desc || createDesc.trim() || null,
          graph: { nodes: [{ id: "trigger", type: "trigger", position: { x: 100, y: 100 }, data: { label: "Cliente envia mensagem" } }], edges: [] }
        }
      });
      router.push(`/dashboard/automacao/${flow.id}`);
    } finally { setCreating(false); }
  }

  async function toggle(flow) {
    await api(`/api/flows/${flow.id}`, { method: "PATCH", body: { enabled: !flow.enabled } });
    load();
  }

  async function confirmDelete() {
    if (!deleteFlow) return;
    setDeleting(true);
    try { await api(`/api/flows/${deleteFlow.id}`, { method: "DELETE" }); setDeleteFlow(null); load(); }
    finally { setDeleting(false); }
  }

  return (
    <div className="page-x pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-accent-purple tracking-widest uppercase">Automação Visual</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold">Fluxos Inteligentes</h1>
          <p className="text-ink-400 mt-1 text-sm">Crie sequências que conversam, qualificam e vendem no WhatsApp — sozinhas.</p>
        </div>
        <button onClick={() => { setCreateName(""); setCreateDesc(""); setCreateOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 shrink-0">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Novo Fluxo
        </button>
      </div>

      {/* Templates */}
      {flows.length === 0 && !loading && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-3">🚀 Começar com um template</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {NODE_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => createFlow(t)} disabled={creating}
                className="card p-4 text-left hover:border-white/20 hover:-translate-y-0.5 transition-all group disabled:opacity-50">
                <div className="size-10 rounded-xl flex items-center justify-center text-xl mb-3 border" style={{ background: `${t.color}12`, borderColor: `${t.color}25` }}>
                  {t.icon}
                </div>
                <div className="text-sm font-semibold group-hover:text-primary transition-colors">{t.name}</div>
                <div className="text-xs text-ink-500 mt-0.5">{t.desc}</div>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: t.nodes }).map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i === 0 ? t.color : `${t.color}30` }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flows list */}
      {loading ? (
        <div className="grid gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="size-12 rounded-xl bg-white/[0.04]" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-white/[0.04] rounded w-1/3" />
                <div className="h-3 bg-white/[0.04] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : flows.length === 0 ? (
        <div className="card p-16 text-center border-dashed">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-primary/10 border border-accent-purple/20 mx-auto flex items-center justify-center mb-5 text-4xl">⚡</div>
          <h2 className="text-xl font-bold">Crie seu primeiro fluxo</h2>
          <p className="text-ink-400 mt-2 text-sm max-w-sm mx-auto">Use os templates acima ou crie do zero. Em minutos você tem um assistente automático rodando.</p>
          <button onClick={() => { setCreateName(""); setCreateDesc(""); setCreateOpen(true); }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-bg font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            + Criar do zero
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {flows.map((flow) => {
            const status = STATUS_COLORS[String(flow.enabled)] || STATUS_COLORS.false;
            const nodeCount = flow.graph?.nodes?.length || 0;
            return (
              <div key={flow.id} className="card p-5 flex items-center gap-4 hover:border-white/15 transition-all group">
                <div className="size-12 rounded-xl bg-gradient-to-br from-accent-purple/20 to-primary/10 border border-accent-purple/20 flex items-center justify-center text-xl shrink-0">⚡</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{flow.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                  </div>
                  {flow.description && <p className="text-xs text-ink-500 mt-0.5 truncate">{flow.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-500">
                    <span>{nodeCount} nó{nodeCount !== 1 ? "s" : ""}</span>
                    {flow.executions > 0 && <span>· {flow.executions} execuções</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(flow)}
                    className={`h-7 w-12 rounded-full border transition-all relative ${flow.enabled ? "bg-primary/20 border-primary/40" : "bg-white/[0.04] border-white/10"}`}>
                    <span className={`absolute top-0.5 size-6 rounded-full transition-all shadow-sm ${flow.enabled ? "left-[22px] bg-primary" : "left-0.5 bg-zinc-500"}`} />
                  </button>
                  <Link href={`/dashboard/automacao/${flow.id}`}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-all">
                    Editar
                  </Link>
                  <button onClick={() => setDeleteFlow(flow)}
                    className="size-8 rounded-lg border border-white/10 flex items-center justify-center text-ink-500 hover:border-red-500/40 hover:text-red-400 transition-all">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Como funciona */}
      <div className="mt-10 card p-6 bg-gradient-to-br from-accent-purple/[0.06] to-card border-accent-purple/20">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <span className="size-6 rounded-lg bg-accent-purple/20 flex items-center justify-center text-sm">💡</span>
          Como funciona o Workflow Visual
        </h3>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { icon: "🎯", title: "Trigger", desc: "Define quando o fluxo inicia" },
            { icon: "💬", title: "Mensagem", desc: "Envia texto, imagem ou áudio" },
            { icon: "⏱️", title: "Delay", desc: "Aguarda X minutos ou horas" },
            { icon: "🔀", title: "Condição", desc: "Ramifica por resposta ou tag" },
          ].map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base shrink-0">{s.icon}</div>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal criar */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Fluxo de Automação"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg bg-white/5 text-sm">Cancelar</button>
            <button onClick={() => createFlow()} disabled={creating || !createName.trim()}
              className="px-5 py-2 rounded-lg bg-primary text-bg font-bold text-sm disabled:opacity-50">
              {creating ? "Criando…" : "Criar e editar →"}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-300 mb-1.5">Nome do fluxo *</label>
            <input value={createName} onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createFlow()}
              placeholder="Ex: Atendimento inicial" autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-300 mb-1.5">Descrição (opcional)</label>
            <input value={createDesc} onChange={e => setCreateDesc(e.target.value)}
              placeholder="Para que serve esse fluxo?"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20" />
          </div>
        </div>
      </Modal>

      {/* Modal deletar */}
      <Modal open={!!deleteFlow} onClose={() => setDeleteFlow(null)} title="Excluir Automação"
        footer={
          <>
            <button onClick={() => setDeleteFlow(null)} className="px-4 py-2 rounded-lg bg-white/5 text-sm">Cancelar</button>
            <button onClick={confirmDelete} disabled={deleting}
              className="px-5 py-2 rounded-lg bg-red-500 text-white font-bold text-sm disabled:opacity-50">
              {deleting ? "Excluindo…" : "Excluir"}
            </button>
          </>
        }>
        <p className="text-ink-300 text-sm">Tem certeza que deseja excluir <span className="font-semibold text-ink-100">"{deleteFlow?.name}"</span>?</p>
        <p className="text-ink-500 text-xs mt-1">Essa ação não pode ser desfeita.</p>
      </Modal>
    </div>
  );
}
