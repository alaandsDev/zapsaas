"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Topbar from "../../../components/dashboard/Topbar";
import { Input, Button } from "../../../components/ui/Field";
import EmptyState from "../../../components/dashboard/EmptyState";
import { api } from "../../../lib/api";

export default function Conversas() {
  const [status, setStatus] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState({});
  const [draft, setDraft] = useState("");
  const msgsEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api("/api/whatsapp/status");
        setStatus(s);
        if (s?.status === "connected") {
          const leads = await api("/api/leads").catch(() => []);
          const arr = Array.isArray(leads) ? leads : leads?.data || [];
          setContacts(arr);
          if (arr[0]) setActive(arr[0]);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return contacts;
    return contacts.filter((c) => [c.name, c.phone].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [q, contacts]);

  const isConnected = status?.status === "connected";

  async function send() {
    if (!draft.trim() || !active) return;
    const text = draft.trim();
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const id = active.id;
    setMessages((m) => ({ ...m, [id]: [...(m[id] || []), { text, out: true, time, status: "sending" }] }));
    setDraft("");
    try {
      await api("/api/whatsapp/send", { method: "POST", body: { phone: active.phone, message: text } });
      setMessages((m) => ({
        ...m,
        [id]: m[id].map((msg, i) => i === m[id].length - 1 ? { ...msg, status: "sent" } : msg),
      }));
    } catch (e) {
      setMessages((m) => ({
        ...m,
        [id]: m[id].map((msg, i) => i === m[id].length - 1 ? { ...msg, status: "failed" } : msg),
      }));
    }
  }

  if (loading) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Suas conversas pelo WhatsApp" />
        <div className="p-12 flex justify-center">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Suas conversas pelo WhatsApp" />
        <div className="p-6 lg:p-8">
          <EmptyState
            icon="📵"
            title="WhatsApp desconectado"
            desc="Conecte um WhatsApp em Conexões para ver as conversas."
            action={<Link href="/dashboard/conexoes"><Button>Ir para Conexões</Button></Link>}
          />
        </div>
      </>
    );
  }

  const activeMsgs = active ? (messages[active.id] || []) : [];

  return (
    <>
      <Topbar title="Conversas" subtitle="Responda mensagens do WhatsApp em tempo real" />
      <div className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r border-white/[0.06] bg-bg/40 flex flex-col">
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-sm font-semibold">💬 Conversas</span>
            <span className="text-xs text-primary">🟢 {status.phone ? `+${status.phone}` : "Conectado"}</span>
          </div>
          <div className="p-3 border-b border-white/[0.06]">
            <Input placeholder="Buscar conversa..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-500">Nenhum contato disponível</div>
            ) : (
              filtered.map((c) => {
                const isActive = active?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActive(c)}
                    className={`w-full text-left px-4 py-3 border-b border-white/[0.04] flex items-center gap-3 transition-colors ${
                      isActive ? "bg-primary/[0.06] border-l-2 border-l-primary" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-sm shrink-0">
                      {(c.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name || c.phone}</div>
                      <div className="text-xs text-ink-500 truncate">{c.phone}</div>
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
                <div className="text-6xl mb-3 opacity-30">💬</div>
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
                  <div className="text-xs text-primary truncate">{active.phone}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {activeMsgs.length === 0 ? (
                  <div className="text-center text-sm text-ink-500 my-8">
                    Nenhuma mensagem ainda. Envie a primeira! 👋
                  </div>
                ) : (
                  activeMsgs.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-[65%] px-3 py-2 rounded-xl text-sm ${
                        m.out
                          ? "ml-auto bg-primary/15 border border-primary/20"
                          : "bg-card2 border border-white/10"
                      }`}
                      style={{ wordBreak: "break-word" }}
                    >
                      {m.text}
                      <div className="text-[10px] text-ink-500 mt-1 text-right">
                        {m.time}
                        {m.out && (
                          <span className={`ml-1 ${m.status === "failed" ? "text-red-400" : "text-primary"}`}>
                            {m.status === "failed" ? "✕" : m.status === "sending" ? "✓" : "✓✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={msgsEndRef} />
              </div>
              <div className="border-t border-white/[0.06] p-3 bg-bg/40">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Digite uma mensagem..."
                    rows={1}
                    className="flex-1 rounded-xl bg-bg/60 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-primary/60 resize-none"
                  />
                  <button
                    onClick={send}
                    disabled={!draft.trim()}
                    className="size-10 rounded-full bg-primary text-bg flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                  >
                    ➤
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
