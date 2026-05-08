"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Topbar from "../../../components/dashboard/Topbar";
import { Input, Button } from "../../../components/ui/Field";
import EmptyState from "../../../components/dashboard/EmptyState";
import { api, API_URL, getToken } from "../../../lib/api";

// Polling fica como fallback caso SSE caia. Intervalo bem maior agora.
const POLL_FALLBACK_MS = 30000;

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Avatar({ src, name, size = 40 }) {
  const [errored, setErrored] = useState(false);
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  if (src && !errored) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setErrored(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-bg2 shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center shrink-0"
    >
      {initial}
    </div>
  );
}

function fmtDayHeader(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hoje";
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function Conversas() {
  const [sessions, setSessions] = useState([]);   // todos slots
  const [activeSlot, setActiveSlot] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const msgsEndRef = useRef(null);

  const connectedSessions = useMemo(
    () => sessions.filter((s) => s.status === "connected"),
    [sessions]
  );

  // Carregar sessões
  const loadSessions = useCallback(async () => {
    try {
      const list = await api("/api/whatsapp/sessions");
      setSessions(list || []);
      const conn = (list || []).filter((s) => s.status === "connected");
      if (conn.length && !activeSlot) setActiveSlot(conn[0].slot);
    } catch {}
  }, [activeSlot]);

  // Carregar chats da slot ativa
  const loadChats = useCallback(async () => {
    if (!activeSlot) return;
    try {
      const list = await api(`/api/chats?slot=${activeSlot}`);
      setChats(list || []);
    } catch {}
  }, [activeSlot]);

  // Carregar mensagens do chat ativo
  const loadMsgs = useCallback(async () => {
    if (!activeChat?.id) return;
    try {
      const list = await api(`/api/chats/${activeChat.id}/messages`);
      setMsgs(list || []);
    } catch {}
  }, [activeChat]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSessions();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeSlot) return;
    setActiveChat(null);
    setMsgs([]);
    loadChats();
  }, [activeSlot]);

  // Carrega mensagens ao trocar de chat
  useEffect(() => { if (activeChat?.id) loadMsgs(); }, [activeChat?.id, loadMsgs]);

  // SSE — recebe novas mensagens em tempo real
  const activeChatRef = useRef(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const url = `${API_URL}/api/chats/stream?token=${encodeURIComponent(token)}`;
    let es;
    try { es = new EventSource(url); } catch { return; }

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        // Atualiza lista de chats (refresh leve)
        loadChats();
        // Se a mensagem é do chat aberto, anexa direto
        const cur = activeChatRef.current;
        if (cur?.id === data.chatId) {
          setMsgs((prev) => {
            // Evita duplicar se a mensagem já veio do envio otimista local
            if (data.direction === "out" && prev.some((m) => m.text === data.text && Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 5000)) {
              return prev;
            }
            return [...prev, {
              id: `sse_${Date.now()}_${Math.random()}`,
              direction: data.direction,
              type: data.type,
              text: data.text,
              media_url: data.media_url || null,
              mime_type: data.mime_type || null,
              status: data.direction === "out" ? "sent" : null,
              timestamp: data.timestamp,
            }];
          });
        }
      } catch {}
    });

    es.onerror = () => { /* navegador reconecta sozinho */ };
    return () => { try { es.close(); } catch {} };
  }, [loadChats]);

  // Polling fallback (caso SSE falhe ou rede instável)
  useEffect(() => {
    if (!activeSlot) return;
    const i = setInterval(() => {
      loadChats();
      if (activeChatRef.current?.id) loadMsgs();
    }, POLL_FALLBACK_MS);
    return () => clearInterval(i);
  }, [activeSlot, loadChats, loadMsgs]);

  // Auto scroll
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, activeChat?.id]);

  const filteredChats = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return chats;
    return chats.filter((c) =>
      [c.name, c.phone, c.last_message].filter(Boolean).join(" ").toLowerCase().includes(term)
    );
  }, [q, chats]);

  async function send() {
    if (!draft.trim() || !activeChat || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    // Otimista
    const tempId = `tmp_${Date.now()}`;
    setMsgs((m) => [...m, {
      id: tempId, direction: "out", type: "text", text,
      status: "pending", timestamp: new Date().toISOString()
    }]);
    try {
      await api("/api/chats/send", {
        method: "POST",
        body: { slot: activeSlot, phone: activeChat.phone, message: text }
      });
      // Recarrega na próxima rodada de poll; aqui só atualiza status local
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "sent" } : msg));
    } catch (e) {
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "failed" } : msg));
    } finally { setSending(false); }
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

  if (!connectedSessions.length) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Suas conversas pelo WhatsApp" />
        <div className="p-6 lg:p-8">
          <EmptyState
            icon="📵"
            title="Nenhum WhatsApp conectado"
            desc="Conecte um número em Conexões para ver suas conversas em tempo real."
            action={<Link href="/dashboard/conexoes"><Button>Ir para Conexões</Button></Link>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Conversas" subtitle="Espelha o WhatsApp Web em tempo real" />

      {/* Tabs por sessão (1 aba por número conectado) */}
      {connectedSessions.length > 1 && (
        <div className="px-4 lg:px-6 pt-3 flex gap-2 border-b border-white/[0.06] bg-bg/40">
          {connectedSessions.map((s) => (
            <button
              key={s.slot}
              onClick={() => setActiveSlot(s.slot)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeSlot === s.slot
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-400 hover:text-ink-200"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" />
                Número {s.slot}
                {s.phone && <span className="text-xs text-ink-500">+{s.phone}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="h-[calc(100vh-4rem-3rem)] grid grid-cols-1 md:grid-cols-[340px_1fr] overflow-hidden">
        {/* Lista de conversas */}
        <aside className="border-r border-white/[0.06] bg-bg/40 flex flex-col min-h-0">
          <div className="p-3 border-b border-white/[0.06]">
            <Input placeholder="🔍 Buscar conversa..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {!filteredChats.length ? (
              <div className="p-8 text-center text-sm text-ink-500">
                {q ? "Nenhuma conversa encontrada" : "Aguardando mensagens — assim que alguém te mandar algo, aparece aqui."}
              </div>
            ) : filteredChats.map((c) => {
              const isActive = activeChat?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveChat(c)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] flex items-center gap-3 transition-colors ${
                    isActive ? "bg-primary/[0.06]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar src={c.profile_pic_url} name={c.name || c.phone} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm truncate">{c.name || `+${c.phone}`}</div>
                      <span className="text-[10px] text-ink-500 shrink-0">{fmtTime(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="text-xs text-ink-400 truncate">{c.last_message || "—"}</div>
                      {c.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">
                          {c.unread > 99 ? "99+" : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat ativo */}
        <section className="flex flex-col bg-card/30 min-h-0">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="text-6xl mb-3 opacity-30">💬</div>
                <h3 className="font-semibold">Selecione uma conversa</h3>
                <p className="text-sm text-ink-500 mt-1">Suas mensagens aparecem aqui em tempo real</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header do chat */}
              <div className="h-16 border-b border-white/[0.06] flex items-center px-5 gap-3 bg-bg/30">
                <Avatar src={activeChat.profile_pic_url} name={activeChat.name || activeChat.phone} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{activeChat.name || `+${activeChat.phone}`}</div>
                  <div className="text-xs text-ink-500 truncate">+{activeChat.phone}</div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                {!msgs.length ? (
                  <div className="text-center text-sm text-ink-500 my-12">
                    Sem mensagens ainda. Mande a primeira 👇
                  </div>
                ) : (
                  msgs.map((m, i) => {
                    // Não renderiza balão se não tem nada útil pra mostrar
                    if (!m.text && !m.media_url && (m.type === "other" || !m.type)) return null;
                    const prev = msgs[i - 1];
                    const showDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString();
                    return (
                      <div key={m.id || m.wa_id || i}>
                        {showDay && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] uppercase tracking-wider text-ink-500 bg-white/5 px-3 py-1 rounded-full">
                              {fmtDayHeader(m.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                            m.direction === "out"
                              ? "ml-auto bg-primary/15 border border-primary/20 rounded-br-sm"
                              : "bg-card2 border border-white/10 rounded-bl-sm"
                          }`}
                          style={{ wordBreak: "break-word" }}
                        >
                          {m.media_url && m.type === "image" && (
                            <a href={m.media_url} target="_blank" rel="noopener noreferrer">
                              <img src={m.media_url} alt="" className="rounded-lg max-w-full max-h-72 object-cover mb-1" />
                            </a>
                          )}
                          {m.media_url && m.type === "audio" && (
                            <audio controls src={m.media_url} className="w-64 max-w-full mb-1" />
                          )}
                          {m.media_url && m.type === "video" && (
                            <video controls src={m.media_url} className="rounded-lg max-w-full max-h-72 mb-1" />
                          )}
                          {m.media_url && m.type === "document" && (
                            <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 mb-1">
                              <span className="text-2xl">📄</span>
                              <span className="text-xs truncate">Abrir documento</span>
                            </a>
                          )}
                          {!m.media_url && m.type !== "text" && m.type !== "other" && (
                            <div className="text-xs text-ink-400 italic">📎 {m.type} (sem prévia)</div>
                          )}
                          {m.text && <div>{m.text}</div>}
                          <div className="text-[10px] text-ink-500 mt-1 text-right flex items-center justify-end gap-1">
                            {fmtTime(m.timestamp)}
                            {m.direction === "out" && (
                              <span className={m.status === "failed" ? "text-red-400" : m.status === "read" ? "text-primary" : ""}>
                                {m.status === "failed" ? "✕"
                                  : m.status === "pending" ? "⌛"
                                  : m.status === "read" ? "✓✓"
                                  : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={msgsEndRef} />
              </div>

              {/* Input */}
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
                    disabled={!draft.trim() || sending}
                    className="size-10 rounded-full bg-primary text-bg flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                    aria-label="Enviar"
                  >
                    {sending ? "⌛" : "➤"}
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
