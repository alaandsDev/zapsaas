"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";

export default function AutomacaoPage() {
  const router = useRouter();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/flows");
      setFlows(data);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createFlow() {
    const name = prompt("Nome da automação:");
    if (!name) return;
    const flow = await api("/api/flows", {
      method: "POST",
      body: {
        name,
        graph: {
          nodes: [{ id: "trigger", type: "trigger", position: { x: 100, y: 100 }, data: { label: "Cliente envia mensagem" } }],
          edges: []
        }
      }
    });
    router.push(`/dashboard/automacao/${flow.id}`);
  }

  async function toggle(flow) {
    await api(`/api/flows/${flow.id}`, { method: "PATCH", body: { enabled: !flow.enabled } });
    load();
  }

  async function remove(flow) {
    if (!confirm(`Excluir "${flow.name}"?`)) return;
    await api(`/api/flows/${flow.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automação Inteligente</h1>
          <p className="text-ink-300 mt-1">Crie fluxos visuais que respondem, conversam e vendem sozinhos no WhatsApp.</p>
        </div>
        <button onClick={createFlow} className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
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
          <button onClick={createFlow} className="mt-6 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
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
                <button onClick={() => remove(f)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
