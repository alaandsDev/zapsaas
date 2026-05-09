"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import Modal from "../../../components/dashboard/Modal";
import ComingSoonOverlay from "../../../components/dashboard/ComingSoonOverlay";

export default function AutomacaoPage() {
  const router = useRouter();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal criar
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal excluir
  const [deleteFlow, setDeleteFlow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/flows");
      setFlows(data);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createFlow(e) {
    e?.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const flow = await api("/api/flows", {
        method: "POST",
        body: {
          name: createName.trim(),
          description: createDesc.trim() || null,
          graph: {
            nodes: [{ id: "trigger", type: "trigger", position: { x: 100, y: 100 }, data: { label: "Cliente envia mensagem" } }],
            edges: []
          }
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
    try {
      await api(`/api/flows/${deleteFlow.id}`, { method: "DELETE" });
      setDeleteFlow(null);
      load();
    } finally { setDeleting(false); }
  }

  function openCreate() {
    setCreateName("");
    setCreateDesc("");
    setCreateOpen(true);
  }

  return (
    <ComingSoonOverlay title="Automação em breve">
      <div className="page-x">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação Inteligente</h1>
          <p className="text-ink-300 mt-1">Crie fluxos visuais que respondem, conversam e vendem sozinhos no WhatsApp.</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
          + Nova automação
        </button>
      </header>

      {loading ? (
        <div className="text-ink-400 text-center py-20">Carregando...</div>
      ) : !flows.length ? (
        <div className="card p-12 text-center">
          <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 mx-auto flex items-center justify-center mb-4">
            <svg className="size-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 0-8-3-8-8s3-8 8-8h6c5 0 8 3 8 8"/></svg>
          </div>
          <h2 className="text-xl font-semibold">Nenhuma automação ainda</h2>
          <p className="text-ink-400 mt-2">Comece criando seu primeiro fluxo de respostas automáticas.</p>
          <button onClick={openCreate} className="mt-6 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
            + Criar primeira automação
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {flows.map((f) => (
            <div key={f.id} className="card p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
              <Link href={`/dashboard/automacao/${f.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className={`size-2.5 rounded-full ${f.enabled ? "bg-primary animate-pulse" : "bg-white/10"}`} />
                  <div className="font-semibold truncate">{f.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.enabled ? "bg-primary/15 text-primary" : "bg-white/5 text-ink-400"}`}>
                    {f.enabled ? "Ativa" : "Pausada"}
                  </span>
                </div>
                {f.description && <p className="text-sm text-ink-400 mt-1 truncate">{f.description}</p>}
              </Link>
              <div className="flex gap-2 ml-4">
                <button onClick={() => toggle(f)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                  {f.enabled ? "Pausar" : "Ativar"}
                </button>
                <Link href={`/dashboard/automacao/${f.id}`} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm">
                  Editar
                </Link>
                <button onClick={() => setDeleteFlow(f)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Criar */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="Nova automação"
        size="sm"
        footer={
          <>
            <button onClick={() => setCreateOpen(false)} disabled={creating} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={createFlow} disabled={creating || !createName.trim()} className="px-5 py-2 rounded-lg bg-primary text-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {creating ? "Criando..." : "Criar e abrir editor →"}
            </button>
          </>
        }
      >
        <form onSubmit={createFlow} className="space-y-4">
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Nome da automação</label>
            <input
              autoFocus
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex: Boas-vindas + oferta"
              className="mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Descrição (opcional)</label>
            <textarea
              rows={2}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Pra que serve esse fluxo?"
              className="mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary resize-none"
            />
          </div>
        </form>
      </Modal>

      {/* Excluir */}
      <Modal
        open={!!deleteFlow}
        onClose={() => !deleting && setDeleteFlow(null)}
        title="Excluir automação"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteFlow(null)} disabled={deleting} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm disabled:opacity-50">
              Cancelar
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2 rounded-lg bg-red-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {deleting ? "Excluindo..." : "Sim, excluir"}
            </button>
          </>
        }
      >
        <p className="text-ink-200">
          Tem certeza que quer excluir a automação <b>"{deleteFlow?.name}"</b>?
        </p>
        <p className="text-sm text-ink-400 mt-2">
          Essa ação não pode ser desfeita. O histórico de execuções desse fluxo também será removido.
        </p>
      </Modal>
      </div>
    </ComingSoonOverlay>
  );
}
