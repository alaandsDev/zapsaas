"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send as SendIcon, Phone, Copy, ChevronDown, MessageSquare,
  Check, CheckCheck, Clock, X,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { Button } from "../../../components/ui/Field";
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
  const [tab, setTab] = useState("todas");
  const [copied, setCopied] = useState(false);
  const msgsEndRef = useRef(null);

  const connectedSessions = useMemo(
    () => sessions.filter((s) => s.status === "connected"),
    [sessions]
  );

  const loadSessions = useCallback(async () => {
    try {
      const list = await api("/api/whatsapp/sessions");
      setSessions(list || []);
      const conn = (list || []).filter((s) => s.status === "connected");
      if (conn.length) {
        const slot = conn[0].slot;
        setActiveSlot(slot);
        return slot;
      }
    } catch {}
    return null;
  }, []);

  const loadChats = useCallback(async (slotOverride) => {
    const slot = slotOverride ?? activeSlot;
    if (!slot) return;
    try {
      const list = await api(`/api/chats?slot=${slot}`);
      setChats(list || []);
    } catch {}
  }, [activeSlot]);

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
      const slot = await loadSessions();
      if (slot) await loadChats(slot);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeSlot) return;
    setActiveChat(null);
    setMsgs([]);
    loadChats(activeSlot);
  }, [activeSlot]);

  useEffect(() => { if (activeChat?.id) loadMsgs(); }, [activeChat?.id, loadMsgs]);

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
        loadChats(activeSlot);
        const cur = activeChatRef.current;
        if (cur?.id === data.chatId) {
          setMsgs((prev) => {
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

  useEffect(() => {
    if (!activeSlot) return;
    const i = setInterval(() => {
      loadChats(activeSlot);
      if (activeChatRef.current?.id) loadMsgs();
    }, POLL_FALLBACK_MS);
    return () => clearInterval(i);
  }, [activeSlot, loadChats, loadMsgs]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, activeChat?.id]);

  const unreadCount = useMemo(() => chats.filter((c) => c.unread > 0).length, [chats]);

  const filteredChats = useMemo(() => {
    let out = chats;
    if (tab === "naolidas") out = out.filter((c) => c.unread > 0);
    const term = q.toLowerCase().trim();
    if (term) {
      out = out.filter((c) =>
        [c.name, c.phone, c.last_message].filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return out;
  }, [q, chats, tab]);

  async function send() {
    if (!draft.trim() || !activeChat || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
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
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "sent" } : msg));
    } catch (e) {
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "failed" } : msg));
    } finally { setSending(false); }
  }

  function copyPhone() {
    if (!activeChat?.phone) return;
    navigator.clipboard?.writeText(`+${activeChat.phone}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (loading) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Atendimento e conversas em tempo real" />
        <div className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[340px_1fr] xl:grid-cols-[340px_1fr_320px]">
          <div className="border-r border-white/[0.06] p-4 space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-11 rounded-full bg-white/[0.05]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-2/3 bg-white/[0.05] rounded" />
                  <div className="h-2.5 w-4/5 bg-white/[0.05] rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:flex items-center justify-center text-ink-600">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </>
    );
  }

  if (!connectedSessions.length) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Atendimento e conversas em tempo real" />
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

  const TABS = [
    { k: "todas", label: "Todas", count: chats.length },
    { k: "naolidas", label: "Não lidas", count: unreadCount },
  ];

  return (
    <>
      <Topbar title="Conversas" subtitle="Atendimento e conversas em tempo real" />

      <div className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[340px_1fr] xl:grid-cols-[340px_1fr_320px] overflow-hidden">

        {/* ── LISTA ── */}
        <aside className="border-r border-white/[0.06] flex flex-col min-h-0"
          style={{ background: "linear-gradient(180deg, #0B1120, #0F172A)" }}>
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-lg font-bold">Conversas</h2>
            <p className="text-xs text-ink-500">Atendimento em tempo real</p>
          </div>

          <div className="px-3 flex items-center gap-1 border-b border-white/[0.06]">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`relative px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  tab === t.k ? "text-primary" : "text-ink-400 hover:text-ink-200"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.k ? "bg-primary/15 text-primary" : "bg-white/[0.05] text-ink-500"
                }`}>{t.count}</span>
                {tab === t.k && (
                  <motion.span layoutId="conv-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
            {connectedSessions.length > 1 && (
              <div className="ml-auto pr-1">
                <select
                  value={activeSlot || ""}
                  onChange={(e) => setActiveSlot(Number(e.target.value))}
                  className="bg-white/[0.04] border border-white/10 rounded-lg text-[11px] px-2 py-1.5 outline-none"
                >
                  {connectedSessions.map((s) => (
                    <option key={s.slot} value={s.slot}>Nº {s.slot}{s.phone ? ` · +${s.phone}` : ""}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-500 group-focus-within:text-primary transition-colors" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_22px_-10px_rgba(0,255,136,0.5)] transition-all placeholder:text-ink-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
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
                  className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-colors mb-0.5 ${
                    isActive ? "bg-primary/[0.08] border border-primary/20" : "border border-transparent hover:bg-white/[0.03]"
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

        {/* ── CHAT ── */}
        <section className="flex flex-col min-h-0" style={{ background: "#0B1120" }}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <MessageSquare className="size-12 mx-auto mb-3 text-ink-700" />
                <h3 className="font-semibold">Selecione uma conversa</h3>
                <p className="text-sm text-ink-500 mt-1">Suas mensagens aparecem aqui em tempo real</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-16 border-b border-white/[0.06] flex items-center px-5 gap-3 backdrop-blur-xl bg-white/[0.02]">
                <Avatar src={activeChat.profile_pic_url} name={activeChat.name || activeChat.phone} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{activeChat.name || `+${activeChat.phone}`}</div>
                  <div className="text-[11px] text-ink-500 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary" /> +{activeChat.phone}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
                {!msgs.length ? (
                  <div className="text-center text-sm text-ink-500 my-12">
                    Sem mensagens ainda. Mande a primeira 👇
                  </div>
                ) : (
                  msgs.map((m, i) => {
                    if (!m.text && !m.media_url && (m.type === "other" || !m.type)) return null;
                    const prev = msgs[i - 1];
                    const showDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString();
                    const out = m.direction === "out";
                    return (
                      <div key={m.id || m.wa_id || i}>
                        {showDay && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] uppercase tracking-wider text-ink-500 bg-white/5 px-3 py-1 rounded-full">
                              {fmtDayHeader(m.timestamp)}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                            out
                              ? "ml-auto rounded-br-sm text-ink-50"
                              : "rounded-bl-sm bg-[#1b2536] border border-white/[0.06]"
                          }`}
                          style={out ? { background: "linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,209,255,0.12))", border: "1px solid rgba(0,255,136,0.25)" } : undefined}
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
                          {m.text && <div style={{ wordBreak: "break-word" }}>{m.text}</div>}
                          <div className="text-[10px] text-ink-500 mt-1 text-right flex items-center justify-end gap-1">
                            {fmtTime(m.timestamp)}
                            {out && (
                              m.status === "failed" ? <X className="size-3 text-red-400" />
                                : m.status === "pending" ? <Clock className="size-3" />
                                : m.status === "read" ? <CheckCheck className="size-3 text-primary" />
                                : m.status === "sent" ? <Check className="size-3" />
                                : <CheckCheck className="size-3" />
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}
                <div ref={msgsEndRef} />
              </div>

              <div className="border-t border-white/[0.06] p-3 bg-white/[0.02]">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
                  />
                  <button
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    className="size-10 rounded-xl flex items-center justify-center text-bg disabled:opacity-50 hover:scale-105 transition-transform"
                    style={{ background: "linear-gradient(135deg, #00FF88, #00D1FF)" }}
                    aria-label="Enviar"
                  >
                    {sending ? <Clock className="size-4" /> : <SendIcon className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── DADOS DO CONTATO ── */}
        <aside className="hidden xl:flex flex-col border-l border-white/[0.06] min-h-0 overflow-y-auto"
          style={{ background: "linear-gradient(180deg, #0B1120, #0F172A)" }}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <p className="text-xs text-ink-600">Selecione uma conversa para ver os dados do contato</p>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="text-sm font-semibold text-ink-300">Dados do contato</div>
              <div className="text-center">
                <div className="inline-block">
                  <Avatar src={activeChat.profile_pic_url} name={activeChat.name || activeChat.phone} size={72} />
                </div>
                <div className="mt-3 font-bold">{activeChat.name || `+${activeChat.phone}`}</div>
                <div className="text-[11px] text-primary flex items-center justify-center gap-1 mt-0.5">
                  <span className="size-1.5 rounded-full bg-primary" /> WhatsApp
                </div>
              </div>

              <button
                onClick={copyPhone}
                className="w-full flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 transition-colors group"
              >
                <span className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Phone className="size-4 text-primary" />
                </span>
                <span className="flex-1 text-left text-sm tabular-nums">+{activeChat.phone}</span>
                {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4 text-ink-500 group-hover:text-ink-200" />}
              </button>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Informações</div>
                <div className="space-y-2.5 text-sm">
                  {[
                    ["Último contato", fmtTime(activeChat.last_message_at) || "—"],
                    ["Não lidas", String(activeChat.unread || 0)],
                    ["Número", `Nº ${activeSlot}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <span className="text-ink-500 text-xs">{k}</span>
                      <span className="text-ink-100 text-xs font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard/leads"
                className="block text-center text-xs font-semibold text-primary border border-primary/30 rounded-xl py-2.5 hover:bg-primary/10 transition-colors"
              >
                Ver no CRM de Leads
              </Link>

              <p className="text-[10px] text-ink-600 leading-relaxed">
                Tags, notas e automações por contato ficam na tela de <Link href="/dashboard/leads" className="text-primary">Leads</Link>, vinculadas ao mesmo número.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
