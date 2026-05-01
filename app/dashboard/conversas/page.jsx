"use client";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Input } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

export default function Conversas() {
  const [leads, setLeads] = useState([]);
  const [active, setActive] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/leads").then((l) => {
      const arr = Array.isArray(l) ? l : l?.data || [];
      setLeads(arr);
      if (arr[0]) setActive(arr[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return leads;
    return leads.filter(l => [l.name, l.phone].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [q, leads]);

  return (
    <>
      <Topbar title="Conversas" subtitle="Suas conversas pelo WhatsApp em um único lugar" />
      <div className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r border-white/[0.06] bg-bg/40 flex flex-col">
          <div className="p-3 border-b border-white/[0.06]">
            <Input placeholder="Buscar conversa..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center"><div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-500">
                Sem conversas ainda. Conecte seu WhatsApp e seus contatos aparecerão aqui.
              </div>
            ) : (
              filtered.map((l) => {
                const isActive = active?.id === l.id;
                return (
                  <button
                    key={l.id}
                    onClick={() => setActive(l)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.04] flex items-center gap-3 transition-colors ${
                      isActive ? "bg-primary/[0.06]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-sm shrink-0">
                      {(l.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{l.name || l.phone}</div>
                      <div className="text-xs text-ink-500 truncate">{l.phone}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col bg-card/30">
          {!active ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-5xl mb-3">💬</div>
                <h3 className="font-semibold">Selecione uma conversa</h3>
                <p className="text-sm text-ink-500 mt-1">Suas mensagens aparecem aqui</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-16 border-b border-white/[0.06] flex items-center px-5 gap-3">
                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-sm">
                  {(active.name || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{active.name || active.phone}</div>
                  <div className="text-xs text-ink-500 truncate">{active.phone}</div>
                </div>
              </div>
              <div
                className="flex-1 overflow-y-auto p-6"
                style={{ backgroundImage: "radial-gradient(circle at 20% 0%, rgba(0,255,178,0.04), transparent 50%)" }}
              >
                <div className="text-center text-sm text-ink-500 my-8">
                  <div className="text-3xl mb-3">📱</div>
                  As mensagens trocadas com {active.name || "este contato"} aparecerão aqui
                  <p className="mt-2 text-xs">Disponível em breve com sincronização em tempo real</p>
                </div>
              </div>
              <div className="border-t border-white/[0.06] p-3 bg-bg/40">
                <div className="flex gap-2 mb-2 flex-wrap">
                  <QuickReply label="Olá! Tudo bem?" />
                  <QuickReply label="Posso ajudar?" />
                  <QuickReply label="Vou verificar e te respondo" />
                </div>
                <Input placeholder="Digite uma mensagem..." disabled />
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function QuickReply({ label }) {
  return (
    <button className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-ink-300 hover:border-primary/30 hover:text-primary transition-colors">
      {label}
    </button>
  );
}
