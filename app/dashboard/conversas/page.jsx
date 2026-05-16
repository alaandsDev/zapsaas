"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import { getSocket } from "../../../lib/socket";

const STATUS = [
  { key: "all", label: "Todas" },
  { key: "open", label: "Abertas" },
  { key: "pending", label: "Pendentes" },
  { key: "closed", label: "Fechadas" },
];
const QUICK = [
  "Olá! Como posso ajudar? 👋",
  "Obrigado pelo contato! Já te respondo.",
  "Pode me enviar mais detalhes, por favor?",
  "Perfeito, vou encaminhar internamente.",
];

function relTime(iso) {
  if (!iso) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function Conversas() {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const scrollRef = useRef(null);

  const loadThreads = () =>
    api("/api/crm/threads").then(setThreads).catch(() => setThreads([]));

  useEffect(() => {
    loadThreads();
    const sock = getSocket();
    if (sock) {
      sock.on("crm:message", () => loadThreads());
      return () => sock.off("crm:message");
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    api(`/api/crm/threads/${active.phone}`).then(setMessages).catch(() => setMessages([]));
    setThreads((ts) => ts.map((t) => (t.phone === active.phone ? { ...t, unread: 0 } : t)));
  }, [active?.phone]);

  useEffect(() => {
    const sock = getSocket();
    if (!sock || !active) return;
    const handler = (m) => {
      if (m.phone === active.phone) {
        setMessages((ms) => [...ms, { id: `rt-${Date.now()}`, direction: m.direction, body: m.body, created_at: m.at }]);
      }
    };
    sock.on("crm:message", handler);
    return () => sock.off("crm:message", handler);
  }, [active?.phone]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const visible = threads.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      (!q || (t.name || "").toLowerCase().includes(q.toLowerCase()) || t.phone.includes(q))
  );

  async function send() {
    if (!draft.trim() || !active) return;
    setSending(true);
    const body = draft;
    setDraft("");
    setMessages((ms) => [...ms, { id: `local-${Date.now()}`, direction: "out", body, created_at: new Date().toISOString() }]);
    try {
      await api(`/api/crm/threads/${active.phone}/reply`, { method: "POST", body: { body } });
    } catch (e) {
      alert(e.message || "Falha ao enviar");
    } finally {
      setSending(false);
    }
  }

  async function patchThread(patch) {
    if (!active) return;
    const updated = await api(`/api/crm/threads/${active.phone}`, { method: "PATCH", body: patch }).catch(() => null);
    if (updated) {
      setActive(updated);
      setThreads((ts) => ts.map((t) => (t.phone === updated.phone ? updated : t)));
    }
  }

  return (
    <>
      <Topbar title="Conversas" subtitle="Inbox unificado do seu WhatsApp" />
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Lista */}
        <div className="w-80 shrink-0 border-r border-white/[0.06] flex flex-col">
          <div className="p-3 space-y-2 border-b border-white/[0.06]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full rounded-xl bg-bg/60 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <div className="flex gap-1">
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilter(s.key)}
                  className={`flex-1 text-[11px] py-1.5 rounded-lg transition-colors ${
                    filter === s.key ? "bg-primary/15 text-primary border border-primary/30" : "text-ink-500 hover:text-ink-100 border border-transparent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 && (
              <div className="text-xs text-ink-500 text-center py-12">Nenhuma conversa</div>
            )}
            {visible.map((t) => (
              <button
                key={t.phone}
                onClick={() => setActive(t)}
                className={`w-full text-left px-3 py-3 border-b border-white/[0.04] flex items-center gap-3 transition-colors ${
                  active?.phone === t.phone ? "bg-primary/[0.07]" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="size-10 rounded-full bg-gradient-to-br from-primary/70 to-accent-purple/70 text-bg font-bold flex items-center justify-center text-sm shrink-0">
                  {(t.name || t.phone)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{t.name || t.phone}</span>
                    <span className="text-[10px] text-ink-500 shrink-0">{relTime(t.last_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-500 truncate flex-1">{t.last_body || "—"}</span>
                    {t.unread > 0 && (
                      <span className="text-[10px] font-bold size-4 rounded-full bg-primary text-bg flex items-center justify-center shrink-0">
                        {t.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversa */}
        <div className="flex-1 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-ink-500 text-sm">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <div className="h-14 border-b border-white/[0.06] flex items-center px-5 gap-3">
                <div className="size-8 rounded-full bg-gradient-to-br from-primary/70 to-accent-purple/70 text-bg font-bold flex items-center justify-center text-xs">
                  {(active.name || active.phone)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{active.name || active.phone}</div>
                  <div className="text-[11px] text-ink-500">{active.phone}</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-2" style={{ backgroundColor: "#0b141a" }}>
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 text-[13px] leading-snug ${
                          m.direction === "out"
                            ? "bg-primary/20 border border-primary/30 text-ink-100 rounded-br-sm"
                            : "bg-[#202c33] text-[#e9edef] rounded-bl-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className="text-[9px] text-ink-500 text-right mt-0.5">{relTime(m.created_at)}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="border-t border-white/[0.06] p-3 space-y-2">
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => setDraft(qr)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-white/10 text-ink-300 hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      {qr.slice(0, 28)}…
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder="Escreva uma resposta..."
                    className="flex-1 rounded-xl bg-bg/60 border border-white/10 px-4 py-3 text-sm outline-none focus:border-primary/60"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="px-5 rounded-xl bg-primary text-bg font-semibold text-sm disabled:opacity-50 hover:bg-primary-hover transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Painel do contato */}
        {active && (
          <div className="w-72 shrink-0 border-l border-white/[0.06] p-4 space-y-5 overflow-y-auto">
            <div className="text-center">
              <div className="size-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent-purple text-bg font-bold flex items-center justify-center text-xl">
                {(active.name || active.phone)[0]?.toUpperCase()}
              </div>
              <div className="mt-2 font-semibold">{active.name || active.phone}</div>
              <div className="text-xs text-ink-500">{active.phone}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Status</div>
              <div className="flex gap-1">
                {["open", "pending", "closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => patchThread({ status: st })}
                    className={`flex-1 text-[11px] py-1.5 rounded-lg transition-colors ${
                      active.status === st ? "bg-primary/15 text-primary border border-primary/30" : "text-ink-500 border border-white/10 hover:text-ink-100"
                    }`}
                  >
                    {st === "open" ? "Aberta" : st === "pending" ? "Pendente" : "Fechada"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Tags</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(active.tags || []).map((tg) => (
                  <span
                    key={tg}
                    onClick={() => patchThread({ tags: active.tags.filter((x) => x !== tg) })}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/40 cursor-pointer hover:line-through"
                  >
                    {tg} ✕
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    patchThread({ tags: [...new Set([...(active.tags || []), tagInput.trim()])] });
                    setTagInput("");
                  }
                }}
                placeholder="+ tag (Enter)"
                className="w-full rounded-lg bg-bg/60 border border-white/10 px-2.5 py-1.5 text-xs outline-none focus:border-primary/60"
              />
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Nota interna</div>
              <textarea
                defaultValue={active.note || ""}
                onBlur={(e) => e.target.value !== active.note && patchThread({ note: e.target.value })}
                placeholder="Anotações da equipe (não enviadas ao cliente)"
                className="w-full min-h-[90px] rounded-lg bg-bg/60 border border-white/10 px-2.5 py-2 text-xs outline-none focus:border-primary/60 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
