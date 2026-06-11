"use client";
import {
  useEffect, useMemo, useRef, useState, useCallback, memo
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send as SendIcon, Phone, Copy, ChevronDown,
  MessageSquare, Check, CheckCheck, Clock, X, Tag,
  Users, Layers, Filter, Mic, Paperclip, MoreHorizontal,
  RefreshCw, Megaphone, ExternalLink, Zap, BadgeCheck,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { Button } from "../../../components/ui/Field";
import EmptyState from "../../../components/dashboard/EmptyState";
import { api, API_URL, getToken } from "../../../lib/api";

// ─── Constantes ─────────────────────────────────────────────────────────────

const POLL_MS = 30_000;
const SEARCH_DEBOUNCE = 220;
const LS_CHANNEL   = "conversation_channel_filter";
const LS_GROUP     = "conversation_group_mode";
const LS_INBOX_COL = "conversation_inbox_collapsed";

// Cor fixa por slot (0 = Canal Oficial / Cloud API, 1-5 = Baileys)
const SLOT_COLOR = {
  0: { hex: "#22D3EE", cls: "bg-accent-blue", text: "text-accent-blue", ring: "border-accent-blue/40", label: "Oficial", name: "Canal Oficial" },
  1: { hex: "#00FF88", cls: "bg-primary",    text: "text-primary",    ring: "border-primary/40",    label: "Nº1", name: "Número 1" },
  2: { hex: "#7C3AED", cls: "bg-secondary",  text: "text-secondary",  ring: "border-secondary/40",  label: "Nº2", name: "Número 2" },
  3: { hex: "#00D1FF", cls: "bg-accent-blue",text: "text-accent-blue",ring: "border-accent-blue/40",label: "Nº3", name: "Número 3" },
  4: { hex: "#F59E0B", cls: "bg-amber-400",  text: "text-amber-400",  ring: "border-amber-400/40",  label: "Nº4", name: "Número 4" },
  5: { hex: "#EF4444", cls: "bg-red-400",    text: "text-red-400",    ring: "border-red-400/40",    label: "Nº5", name: "Número 5" },
};
function slotColor(slot) {
  return SLOT_COLOR[slot] ?? { hex: "#8B8B8B", cls: "bg-ink-500", text: "text-ink-400", ring: "border-white/20", label: `Nº${slot}`, name: `Número ${slot}` };
}

// Estado operacional da conversa baseado em dados disponíveis
function chatStatus(chat) {
  if (chat?.is_ai)                          return { dot: "#F59E0B", label: "IA respondendo" };
  if (chat?.last_direction === "out")       return { dot: "#00FF88", label: "Atendendo agora" };
  if (!chat?.last_message_at)              return { dot: "#4B5563", label: "Sem atividade" };
  const diff = Date.now() - new Date(chat.last_message_at).getTime();
  if (diff < 3_600_000)                    return { dot: "#00FF88", label: "Atendendo agora" };
  return { dot: "#4B5563", label: "Sem atividade" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
function fmtRelative(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return "agora";
  if (diff < 3600_000) return `${Math.floor(diff/60_000)}min`;
  if (diff < 86400_000) return `${Math.floor(diff/3600_000)}h`;
  return fmtTime(iso);
}
function fmtDayHeader(iso) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hoje";
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Componentes menores ──────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  const initial = (name || "?").trim()[0]?.toUpperCase() || "?";
  if (src && !err) {
    return <img src={src} alt="" onError={() => setErr(true)}
      style={{ width: size, height: size }}
      className="rounded-full object-cover bg-bg2 shrink-0" />;
  }
  return (
    <div style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className="rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}

// Badge colorida de canal
function ChannelBadge({ slot, tiny = false }) {
  const c = slotColor(slot);
  if (tiny) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold"
        style={{ color: c.hex }}>
        <span className="size-1.5 rounded-full shrink-0" style={{ background: c.hex }} />
        {c.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ color: c.hex, borderColor: `${c.hex}40`, background: `${c.hex}15` }}>
      <span className="size-1.5 rounded-full" style={{ background: c.hex }} />
      {c.label}
    </span>
  );
}

// Toast simples (1500ms para troca de canal, 2500ms padrão)
function Toast({ msg, duration = 2500, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, duration); return () => clearTimeout(t); }, [onClose, duration]);
  return (
    <motion.div initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-[200] bg-[#0F172A] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-2xl flex items-center gap-2.5">
      <Check className="size-4 text-primary shrink-0" />
      <span className="text-ink-100">{msg}</span>
    </motion.div>
  );
}

// Item de conversa (memo para evitar re-render desnecessário)
const ChatItem = memo(function ChatItem({ chat, isActive, showChannel, onClick }) {
  const c = slotColor(chat.slot);
  return (
    <motion.button onClick={onClick}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`relative w-full text-left pl-4 pr-3 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-[180ms] mb-0.5 overflow-hidden ${
        isActive
          ? "bg-primary/[0.07] border border-primary/20"
          : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.04]"
      }`}>
      {/* Barra lateral colorida — conversa ativa */}
      {isActive && (
        <motion.span
          layoutId="chat-active-bar"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{ background: c.hex }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
      )}
      <div className="relative shrink-0">
        <Avatar src={chat.profile_pic_url} name={chat.name || chat.phone} size={44} />
        {showChannel && (
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-[#0B1120]"
            style={{ background: c.hex }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm truncate">{chat.name || `+${chat.phone}`}</div>
          <span className="text-[10px] text-ink-500 shrink-0">{fmtRelative(chat.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {showChannel && <ChannelBadge slot={chat.slot} tiny />}
            <div className="text-xs text-ink-400 truncate">{chat.last_message || "—"}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Micro indicadores */}
            {chat.is_ai    && <span title="Respondido por IA" className="text-[9px] text-accent-blue">⚡</span>}
            {chat.lead_id  && <span title="Com lead" className="text-[9px] text-amber-400">🏷</span>}
            {chat.unread > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">
                {chat.unread > 99 ? "99+" : chat.unread}
              </span>
            ) : chat.last_direction === "out" ? (
              <Check className="size-3 text-ink-600" title="Respondido" />
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
});

// Grupo de canal (modo agrupado por canal)
function ChannelGroup({ slot, sessionPhone, chats, activeChat, onSelect }) {
  const c = slotColor(slot);
  const totalUnread = chats.reduce((acc, ch) => acc + (ch.unread || 0), 0);
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0 z-10"
        style={{ background: "linear-gradient(180deg,#0B1120,#0B1120cc)" }}>
        <span className="size-2 rounded-full" style={{ background: c.hex }} />
        <span className="text-[11px] font-semibold" style={{ color: c.hex }}>{c.label}</span>
        {sessionPhone && <span className="text-[10px] text-ink-500">· +{sessionPhone}</span>}
        {totalUnread > 0 && (
          <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-bg text-[10px] font-bold flex items-center justify-center"
            style={{ background: c.hex }}>
            {totalUnread}
          </span>
        )}
      </div>
      {chats.map((chat) => (
        <ChatItem key={chat.id} chat={chat} isActive={activeChat?.id === chat.id}
          showChannel={false} onClick={() => onSelect(chat)} />
      ))}

    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Conversas() {
  const [sessions,    setSessions]    = useState([]);
  const [allChats,    setAllChats]    = useState([]);   // chats de TODOS os slots
  const [activeChat,  setActiveChat]  = useState(null);
  const [msgs,        setMsgs]        = useState([]);
  const [rawQ,        setRawQ]        = useState("");
  const [q,           setQ]           = useState("");
  const [draft,       setDraft]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(false);
  const [toast,          setToast]          = useState(null);  // { msg, duration }
  const [showFilters,    setShowFilters]    = useState(false);
  const [inboxCollapsed, setInboxCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(LS_INBOX_COL);
    if (stored !== null) return stored === "true";
    return window.innerWidth < 768; // recolhido no mobile por padrão
  });
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "syncing" | "updated"
  const syncTimer = useRef(null);

  // Filtros operacionais (combinável)
  const [filterUnread,    setFilterUnread]    = useState(false);
  const [filterIA,        setFilterIA]        = useState(false);
  const [filterWithLead,  setFilterWithLead]  = useState(false);
  const [filterNoReply,   setFilterNoReply]   = useState(false);

  // Canal selecionado: "all" ou número do slot
  const [channelFilter, setChannelFilter] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(LS_CHANNEL) || "all";
    return "all";
  });

  // Modo de agrupamento
  const [groupMode, setGroupMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem(LS_GROUP) || "contacts";
    return "contacts";
  });

  const msgsEndRef    = useRef(null);
  const activeChatRef = useRef(null);
  const searchTimer   = useRef(null);
  const fileInputRef  = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile,   setPendingFile]   = useState(null); // { file, previewUrl }
  const [moreMenuOpen, setMoreMenuOpen]   = useState(false);
  const [aiLoading,    setAiLoading]      = useState(false);

  // Modal Nova Conversa
  const [newChatOpen,       setNewChatOpen]       = useState(false);
  const [newChatPhone,      setNewChatPhone]       = useState("");
  const [newChatName,       setNewChatName]        = useState("");
  const [newChatMsg,        setNewChatMsg]         = useState("");
  const [newChatSlot,       setNewChatSlot]        = useState(null);
  const [newChatSending,    setNewChatSending]     = useState(false);
  const ncSearchTimer = useRef(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Persistir preferências + toast ao trocar canal
  const isFirstMount = useRef(true);
  useEffect(() => {
    localStorage.setItem(LS_CHANNEL, channelFilter);
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (channelFilter === "all") {
      setToast({ msg: "Mostrando todos os canais", duration: 1500 });
    } else {
      const sess = connectedSessions.find((s) => String(s.slot) === channelFilter);
      const label = sess?.phone ? `+${sess.phone}` : slotColor(Number(channelFilter)).label;
      setToast({ msg: `Mudou para ${label}`, duration: 1500 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter]);
  useEffect(() => { localStorage.setItem(LS_GROUP, groupMode); }, [groupMode]);
  useEffect(() => { localStorage.setItem(LS_INBOX_COL, String(inboxCollapsed)); }, [inboxCollapsed]);

  // Debounce de busca
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setQ(rawQ), SEARCH_DEBOUNCE);
    return () => clearTimeout(searchTimer.current);
  }, [rawQ]);

  const connectedSessions = useMemo(
    () => sessions.filter((s) => s.status === "connected"),
    [sessions]
  );

  // ── Carrega sessões (Baileys + Canal Oficial slot 0) ──────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const [list, cloudCfg] = await Promise.allSettled([
        api("/api/whatsapp/sessions"),
        api("/api/wpp-cloud/config"),
      ]);
      const baileys = list.status === "fulfilled" ? (list.value || []) : [];
      const cloud   = cloudCfg.status === "fulfilled" && cloudCfg.value?.has_token
        ? [{ slot: 0, status: "connected", phone: cloudCfg.value.verified_name || "Canal Oficial", isCloud: true }]
        : [];
      const all = [...cloud, ...baileys];
      setSessions(all);
      return all.filter((s) => s.status === "connected");
    } catch { return []; }
  }, []);

  // ── Carrega chats de TODOS os canais conectados ────────────────────────────
  const loadAllChats = useCallback(async (connected) => {
    if (!connected?.length) return;
    setSyncStatus("syncing");
    try {
      const results = await Promise.allSettled(
        connected.map((s) =>
          api(`/api/chats?slot=${s.slot}`)
            .then((list) => (list || []).map((c) => ({ ...c, slot: s.slot, sessionPhone: s.phone })))
        )
      );
      const merged = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value);
      merged.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
      setAllChats(merged);
      setSyncStatus("updated");
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => setSyncStatus("idle"), 4000);
    } catch { setSyncStatus("idle"); }
  }, []);

  const loadMsgs = useCallback(async () => {
    if (!activeChat?.id) return;
    try {
      const list = await api(`/api/chats/${activeChat.id}/messages`);
      const server = list || [];
      // Mescla: preserva mensagens locais recentes (<60s) que o servidor ainda
      // não devolveu, para o reload do polling nunca "sumir" com o que acabou de enviar.
      setMsgs((prev) => {
        const recentLocal = prev.filter((m) =>
          (String(m.id).startsWith("tmp_") || String(m.id).startsWith("sse_")) &&
          Date.now() - new Date(m.timestamp).getTime() < 60_000 &&
          !server.some((s) => s.direction === m.direction && (s.text || "") === (m.text || ""))
        );
        return [...server, ...recentLocal];
      });
    } catch {}
    // Depende só do ID: evita recarregar quando só metadados mudam (foto, unread via SSE).
  }, [activeChat?.id]);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const conn = await loadSessions();
      await loadAllChats(conn);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (activeChat?.id) loadMsgs(); }, [activeChat?.id, loadMsgs]);

  // ── Deep-link ?phone= (vindo do CRM "Abrir conversa") ───────────────────────
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (loading || deepLinkDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const wanted = (params.get("phone") || "").replace(/\D/g, "");
    if (!wanted) return;
    deepLinkDone.current = true;
    const match = allChats.find((c) => String(c.phone || "").replace(/\D/g, "") === wanted);
    if (match) {
      selectChat(match);
    } else {
      // Sem chat ainda — abre o modal de nova conversa já preenchido
      setNewChatPhone(wanted);
      setNewChatOpen(true);
    }
    // limpa a URL para não reabrir ao atualizar
    window.history.replaceState({}, "", window.location.pathname);
  }, [loading, allChats]);

  // ── Tempo real — ouve evento global do NotificationProvider ─────────────────
  // (uma única conexão SSE por tab, gerenciada pelo NotificationProvider)
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = e.detail || {};
        // Atualiza a lista de chats
        setAllChats((prev) => {
          const idx = prev.findIndex((c) => c.id === data.chatId);
          if (idx === -1) return prev;
          const updated = { ...prev[idx], last_message: data.text, last_message_at: data.timestamp };
          if (data.direction === "in" && activeChatRef.current?.id !== data.chatId) {
            updated.unread = (updated.unread || 0) + 1;
          }
          const next = [...prev];
          next.splice(idx, 1);
          return [updated, ...next];
        });
        // Adiciona mensagem se a conversa ativa
        const cur = activeChatRef.current;
        if (cur?.id === data.chatId) {
          setMsgs((prev) => {
            if (data.direction === "out" && prev.some(
              (m) => m.text === data.text && Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 5000
            )) return prev;
            return [...prev, {
              id: `sse_${Date.now()}_${Math.random()}`,
              direction: data.direction, type: data.type, text: data.text,
              media_url: data.media_url || null, mime_type: data.mime_type || null,
              status: data.direction === "out" ? "sent" : null,
              timestamp: data.timestamp,
            }];
          });
        }
      } catch {}
    };
    window.addEventListener("wayvo:new-message", handler);
    return () => window.removeEventListener("wayvo:new-message", handler);
  }, []);

  // ── Sincroniza unread real do WhatsApp via SSE ───────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const { chatId, unread } = e.detail || {};
        if (!chatId || unread === undefined) return;
        setAllChats((prev) => prev.map((c) =>
          c.id === chatId ? { ...c, unread } : c
        ));
      } catch {}
    };
    window.addEventListener("wayvo:chat-unread", handler);
    return () => window.removeEventListener("wayvo:chat-unread", handler);
  }, []);

  // ── Atualiza foto de perfil em tempo real via SSE ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      try {
        const { chatId, profile_pic_url } = e.detail || {};
        if (!chatId || !profile_pic_url) return;
        setAllChats((prev) => prev.map((c) =>
          c.id === chatId ? { ...c, profile_pic_url } : c
        ));
        setActiveChat((prev) =>
          prev?.id === chatId ? { ...prev, profile_pic_url } : prev
        );
      } catch {}
    };
    window.addEventListener("wayvo:profile-pic", handler);
    return () => window.removeEventListener("wayvo:profile-pic", handler);
  }, []);

  // ── Poll fallback ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connectedSessions.length) return;
    const i = setInterval(async () => {
      await loadAllChats(connectedSessions);
      if (activeChatRef.current?.id) loadMsgs();
    }, POLL_MS);
    return () => clearInterval(i);
  }, [connectedSessions, loadAllChats, loadMsgs]);

  // ── Auto-scroll msgs ────────────────────────────────────────────────────────
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, activeChat?.id]);

  // ── Filtros + busca ─────────────────────────────────────────────────────────
  const filteredChats = useMemo(() => {
    let out = allChats;
    // Filtro de canal
    if (channelFilter !== "all") out = out.filter((c) => String(c.slot) === channelFilter);
    // Filtros operacionais
    if (filterUnread)   out = out.filter((c) => c.unread > 0);
    if (filterIA)       out = out.filter((c) => c.is_ai);
    if (filterWithLead) out = out.filter((c) => c.lead_id);
    if (filterNoReply)  out = out.filter((c) => c.last_direction === "in" || !c.last_direction);
    // Busca
    const term = q.toLowerCase().trim();
    if (term) {
      out = out.filter((c) =>
        [c.name, c.phone, c.last_message].filter(Boolean).join(" ").toLowerCase().includes(term)
      );
    }
    return out;
  }, [allChats, channelFilter, filterUnread, filterIA, filterWithLead, filterNoReply, q]);

  // Contadores por canal
  const channelCounts = useMemo(() => {
    const map = { all: { total: allChats.length, unread: 0 } };
    allChats.forEach((c) => {
      const k = String(c.slot);
      if (!map[k]) map[k] = { total: 0, unread: 0 };
      map[k].total++;
      if (c.unread > 0) { map[k].unread += c.unread; map.all.unread += c.unread; }
    });
    return map;
  }, [allChats]);

  // Chats agrupados por canal (modo canais)
  const groupedBySlot = useMemo(() => {
    const map = {};
    filteredChats.forEach((c) => {
      const k = c.slot;
      if (!map[k]) map[k] = [];
      map[k].push(c);
    });
    return map;
  }, [filteredChats]);

  // ── Enviar mensagem ─────────────────────────────────────────────────────────
  async function send() {
    if (!draft.trim() || !activeChat || sending) return;
    const text  = draft.trim();
    const slot  = activeChat.slot;
    setDraft("");
    setSending(true);
    const tempId = `tmp_${Date.now()}`;
    setMsgs((m) => [...m, {
      id: tempId, direction: "out", type: "text", text,
      status: "pending", timestamp: new Date().toISOString(),
    }]);
    try {
      await api("/api/chats/send", {
        method: "POST",
        body: { slot, phone: activeChat.phone, message: text },
      });
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "sent" } : msg));
    } catch {
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "failed" } : msg));
    } finally { setSending(false); }
  }

  async function sendFile(file, caption = "") {
    if (!file || !activeChat) return;
    setUploadingFile(true);
    const cap = caption || draft.trim();
    setDraft(""); // legenda enviada com a mídia — limpa o campo
    const tempId = `tmp_${Date.now()}`;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const msgType = isImage ? "image" : isVideo ? "video" : "document";
    // Preview local enquanto envia
    const localUrl = URL.createObjectURL(file);
    setMsgs((m) => [...m, {
      id: tempId, direction: "out", type: msgType,
      text: cap || null, media_url: localUrl,
      status: "pending", timestamp: new Date().toISOString(),
    }]);
    try {
      const token = (await import("../../../lib/api")).getToken();
      const form = new FormData();
      form.append("file", file);
      form.append("slot", String(activeChat.slot));
      form.append("phone", activeChat.phone);
      form.append("caption", cap);
      const res = await fetch(`${API_URL}/api/chats/send-media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao enviar mídia");
      }
      const { mediaUrl } = await res.json();
      setMsgs((m) => m.map((msg) => msg.id === tempId
        ? { ...msg, status: "sent", media_url: mediaUrl }
        : msg));
      if (caption || draft.trim()) setDraft("");
    } catch (e) {
      setToast({ msg: e.message || "Falha ao enviar arquivo", duration: 3000 });
      setMsgs((m) => m.map((msg) => msg.id === tempId ? { ...msg, status: "failed" } : msg));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      URL.revokeObjectURL(localUrl);
    }
  }

  function selectChat(chat) {
    setActiveChat(chat);
    if (chat.unread > 0) {
      setAllChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c));
    }
    // Marca como lida no WhatsApp (envia o "visto" ao contato)
    api(`/api/chats/${chat.id}/read`, { method: "POST" }).catch(() => {});
  }

  function markUnread() {
    if (!activeChat) return;
    setMoreMenuOpen(false);
    setAllChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, unread: 1 } : c));
    api(`/api/chats/${activeChat.id}/unread`, { method: "POST" }).catch(() => {});
  }

  async function suggestAI() {
    if (!activeChat?.id || aiLoading) return;
    setAiLoading(true);
    try {
      const r = await api("/api/ai-suggest", { method: "POST", body: { chatId: activeChat.id } });
      if (r?.suggestion) setDraft(r.suggestion);
      else setToast({ msg: "IA não retornou sugestão — configure OPENAI_API_KEY", duration: 3000 });
    } catch (e) {
      setToast({ msg: e.message || "Falha na sugestão de IA", duration: 3000 });
    } finally { setAiLoading(false); }
  }

  function copyPhone() {
    if (!activeChat?.phone) return;
    navigator.clipboard?.writeText(`+${activeChat.phone}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }


  async function startNewChat() {
    const phone = newChatPhone.replace(/\D/g, "");
    if (!phone || phone.length < 8) {
      setToast({ msg: "Informe um número válido (com DDD)", duration: 2500 });
      return;
    }
    if (!newChatName.trim()) {
      setToast({ msg: "Informe o nome do contato", duration: 2500 });
      return;
    }
    if (!newChatMsg.trim()) {
      setToast({ msg: "Escreva uma mensagem para iniciar", duration: 2500 });
      return;
    }
    const slot = newChatSlot ?? connectedSessions[0]?.slot;
    if (slot === undefined || slot === null) {
      setToast({ msg: "Nenhum WhatsApp conectado", duration: 2500 });
      return;
    }
    setNewChatSending(true);
    try {
      // 1) Verifica se lead já existe com esse telefone
      let leadExists = false;
      try {
        const leads = await api(`/api/leads?q=${encodeURIComponent(phone)}`);
        leadExists = Array.isArray(leads) && leads.some((l) => l.phone?.replace(/\D/g, "") === phone);
      } catch {}

      // 2) Se não existe, cria o lead
      if (!leadExists) {
        await api("/api/leads", {
          method: "POST",
          body: { name: newChatName.trim(), phone, source: "conversa" },
        });
      }

      // 3) Envia a mensagem
      await api("/api/chats/send", {
        method: "POST",
        body: { phone, message: newChatMsg.trim(), slot },
      });

      setToast({ msg: leadExists ? `Mensagem enviada para ${newChatName}` : `Lead criado e mensagem enviada para ${newChatName}`, duration: 3000 });
      setNewChatOpen(false);
      setNewChatPhone("");
      setNewChatName("");
      setNewChatMsg("");
      setNewChatSlot(null);
      // Recarrega lista e tenta abrir o chat do número enviado
      await loadAllChats(connectedSessions);
      // Tenta encontrar o chat pelo telefone (pode demorar um pouco pra aparecer)
      const tryOpen = async (attempts = 0) => {
        const updated = await api("/api/chats?limit=200").catch(() => null);
        if (!updated) return;
        const found = (Array.isArray(updated) ? updated : updated.chats ?? [])
          .find((c) => c.phone?.replace(/\D/g, "") === phone);
        if (found) {
          selectChat(found);
        } else if (attempts < 4) {
          setTimeout(() => tryOpen(attempts + 1), 1500);
        }
      };
      tryOpen();
    } catch (e) {
      setToast({ msg: e.message || "Falha ao enviar", duration: 3000 });
    } finally {
      setNewChatSending(false);
    }
  }

  // ── Tela de loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Topbar title="Conversas" subtitle="Inbox multi-canal em tempo real" />
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
        <Topbar title="Conversas" subtitle="Inbox multi-canal em tempo real" />
        <div className="p-6 lg:p-8">
          <EmptyState icon="📵" title="Nenhum canal conectado"
            desc="Conecte um número em Canais ou configure o Canal Oficial para ver suas conversas."
            action={<Link href="/dashboard/canais"><Button>Ir para Canais</Button></Link>} />
        </div>
      </>
    );
  }

  const showChannelDot = channelFilter === "all" && connectedSessions.length > 1;
  const activeSlotForReply = activeChat?.slot ?? connectedSessions[0]?.slot;
  const replyColor = slotColor(activeSlotForReply);
  const activeSession = connectedSessions.find((s) => s.slot === activeSlotForReply);

  return (
    <>
      <Topbar title="Conversas" subtitle="Inbox multi-canal em tempo real" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast key="toast" msg={toast.msg} duration={toast.duration}
            onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] xl:grid-cols-[320px_1fr_288px] overflow-hidden">

        {/* ══════════════════════════════════════════════════
            LISTA LATERAL
        ══════════════════════════════════════════════════ */}
        <aside className="border-r border-white/[0.06] flex flex-col min-h-0 overflow-hidden"
          style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)" }}>

          {/* ── Seletor de canal (colapsável) ── */}
          <div className="border-b border-white/[0.06]">
            {/* Header clicável do bloco */}
            <button
              onClick={() => setInboxCollapsed((v) => !v)}
              className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
              <Layers className="size-3.5 text-ink-500 group-hover:text-ink-300 transition-colors shrink-0" />
              <span className="flex-1 text-left text-[11px] font-semibold uppercase tracking-widest text-ink-500 group-hover:text-ink-300 transition-colors">
                Inbox
              </span>
              {/* Contagem compacta quando recolhido */}
              {inboxCollapsed && (
                <span className="text-[11px] tabular-nums text-ink-500 mr-1">{allChats.length}</span>
              )}
              {/* Unread global quando recolhido */}
              {inboxCollapsed && (channelCounts.all?.unread || 0) > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-bg text-[9px] font-bold flex items-center justify-center mr-1">
                  {channelCounts.all.unread > 99 ? "99+" : channelCounts.all.unread}
                </span>
              )}
              <motion.span
                animate={{ rotate: inboxCollapsed ? -90 : 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}>
                <ChevronDown className="size-3.5 text-ink-600" />
              </motion.span>
            </button>

            {/* Chips expansíveis */}
            <AnimatePresence initial={false}>
              {!inboxCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="overflow-hidden">
                  <div className="flex flex-col gap-1 px-3 pb-3">
                    {/* Chip "Todas" */}
                    <button
                      onClick={() => setChannelFilter("all")}
                      className={`flex items-center gap-2.5 px-3 rounded-xl text-[12px] font-semibold transition-all duration-[150ms] border h-10 ${
                        channelFilter === "all"
                          ? "bg-white/[0.07] border-white/15 text-ink-100"
                          : "border-transparent text-ink-400 hover:text-ink-200 hover:bg-white/[0.04]"
                      }`}>
                      <Layers className="size-3.5 shrink-0 text-ink-500" />
                      <span className="flex-1 text-left">Todas</span>
                      <span className="text-[11px] tabular-nums text-ink-500">
                        {channelCounts.all?.total || 0}
                        {(channelCounts.all?.unread || 0) > 0 &&
                          <span className="text-primary"> · {channelCounts.all.unread} não lidas</span>}
                      </span>
                    </button>

                    {/* Chips por canal */}
                    {connectedSessions.map((s) => {
                      const key    = String(s.slot);
                      const c      = slotColor(s.slot);
                      const count  = channelCounts[key] || { total: 0, unread: 0 };
                      const active = channelFilter === key;
                      return (
                        <button key={s.slot}
                          onClick={() => setChannelFilter(key)}
                          className={`flex items-center gap-2.5 px-3 rounded-xl text-[12px] font-semibold transition-all duration-[150ms] border h-10 ${
                            active ? "" : "border-transparent text-ink-400 hover:text-ink-200 hover:bg-white/[0.04]"
                          }`}
                          style={active ? { borderColor: `${c.hex}35`, background: `${c.hex}10`, color: c.hex } : {}}>
                          <span className="size-2 rounded-full shrink-0"
                            style={{ background: active ? c.hex : "#4B5563",
                                     boxShadow: active ? `0 0 5px ${c.hex}70` : "none" }} />
                          <span className="flex-1 text-left">{c.name}</span>
                          <span className={`text-[11px] tabular-nums ${active ? "opacity-70" : "text-ink-600"}`}>
                            {count.total}
                            {count.unread > 0 &&
                              <span style={{ color: c.hex }}> · {count.unread} não lidas</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Busca + controles ── */}
          <div className="px-4 pt-3 pb-1 space-y-2">
            <div className="flex items-center gap-2">
              {/* Botão Nova Conversa */}
              <button onClick={() => setNewChatOpen(true)}
                title="Nova Conversa"
                className="size-8 rounded-xl border border-primary/40 bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
              </button>
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-500 group-focus-within:text-primary transition-colors" />
                <input value={rawQ} onChange={(e) => setRawQ(e.target.value)}
                  placeholder="Buscar conversas..."
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] pl-8 pr-3 py-2 text-xs outline-none focus:border-primary/50 focus:shadow-[0_0_20px_-10px_rgba(0,255,136,0.5)] transition-all placeholder:text-ink-500" />
              </div>
              {/* Toggle filtros operacionais */}
              <button onClick={() => setShowFilters(!showFilters)}
                className={`size-8 rounded-xl border flex items-center justify-center transition-colors ${
                  showFilters || filterUnread || filterIA || filterWithLead || filterNoReply
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/[0.08] bg-white/[0.03] text-ink-400 hover:text-ink-200"
                }`}>
                <Filter className="size-3.5" />
              </button>
              {/* Toggle modo agrupamento */}
              <button onClick={() => setGroupMode(groupMode === "contacts" ? "channels" : "contacts")}
                title={groupMode === "contacts" ? "Agrupar por canais" : "Agrupar por contatos"}
                className={`size-8 rounded-xl border flex items-center justify-center transition-colors ${
                  groupMode === "channels"
                    ? "border-accent-blue/40 bg-accent-blue/10 text-accent-blue"
                    : "border-white/[0.08] bg-white/[0.03] text-ink-400 hover:text-ink-200"
                }`}>
                {groupMode === "channels" ? <Layers className="size-3.5" /> : <Users className="size-3.5" />}
              </button>
            </div>

            {/* Filtros operacionais (expansível) */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {[
                      { key: "unread",   label: "Não lidas",  val: filterUnread,   set: setFilterUnread   },
                      { key: "ia",       label: "Somente IA", val: filterIA,       set: setFilterIA       },
                      { key: "withlead", label: "Com lead",   val: filterWithLead, set: setFilterWithLead },
                      { key: "noreply",  label: "Sem resposta",val: filterNoReply, set: setFilterNoReply  },
                    ].map(({ key, label, val, set }) => (
                      <button key={key} onClick={() => set(!val)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                          val ? "bg-primary/15 border-primary/40 text-primary" : "border-white/10 text-ink-400 hover:text-ink-200"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Lista de conversas ── */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 mt-1.5">
            {!filteredChats.length ? (
              <div className="p-8 text-center">
                <MessageSquare className="size-8 mx-auto mb-3 text-ink-700" />
                <p className="text-sm text-ink-500">
                  {q ? "Nenhuma conversa encontrada" :
                   channelFilter !== "all" ? `Nenhuma conversa neste canal` :
                   "Nenhuma conversa ainda"}
                </p>
                {!q && channelFilter === "all" && (
                  <>
                    <p className="text-xs text-ink-600 mt-2 max-w-[220px] mx-auto leading-relaxed">
                      Inicie uma conversa com um número ou aguarde seus clientes chamarem no WhatsApp.
                    </p>
                    <button onClick={() => setNewChatOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-bg"
                      style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
                      <MessageSquare className="size-3.5" />
                      Nova conversa
                    </button>
                  </>
                )}
                {(q || channelFilter !== "all") && (
                  <button onClick={() => { setRawQ(""); setChannelFilter("all"); }}
                    className="mt-3 text-xs text-primary hover:underline">
                    Ver todas
                  </button>
                )}
              </div>
            ) : groupMode === "channels" ? (
              Object.entries(groupedBySlot).map(([slot, chats]) => {
                const sess = connectedSessions.find((s) => String(s.slot) === slot);
                return (
                  <ChannelGroup key={slot} slot={Number(slot)} sessionPhone={sess?.phone}
                    chats={chats} activeChat={activeChat} onSelect={selectChat} />
                );
              })
            ) : (
              filteredChats.map((c) => (
                <ChatItem key={c.id} chat={c} isActive={activeChat?.id === c.id}
                  showChannel={showChannelDot} onClick={() => selectChat(c)} />
              ))
            )}

            {filteredChats.length > 0 && (
              <button onClick={() => loadAllChats(connectedSessions)}
                className="w-full py-3 text-[11px] text-ink-500 hover:text-ink-300 flex items-center justify-center gap-1.5 transition-colors">
                <RefreshCw className="size-3" /> Atualizar conversas
              </button>
            )}
          </div>

          {/* ── Resumo por canal (rodapé) ── */}
          {connectedSessions.length > 1 && (
            <div className="border-t border-white/[0.06] px-4 py-3 flex gap-4 overflow-x-auto scrollbar-none">
              {connectedSessions.map((s) => {
                const c     = slotColor(s.slot);
                const count = channelCounts[String(s.slot)] || { unread: 0, total: 0 };
                return (
                  <button key={s.slot} onClick={() => setChannelFilter(String(s.slot))}
                    className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity group">
                    <span className="size-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                      style={{ background: c.hex, boxShadow: `0 0 6px ${c.hex}60` }} />
                    <div className="text-left">
                      <div className="text-[11px] font-semibold" style={{ color: c.hex }}>{c.label}</div>
                      <div className="text-[10px] text-ink-500">
                        {count.unread > 0
                          ? <span style={{ color: c.hex }}>{count.unread} não lidas</span>
                          : <span>{count.total} conversas</span>
                        }
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ══════════════════════════════════════════════════
            ÁREA DE CHAT
        ══════════════════════════════════════════════════ */}
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
              {/* ── Preview de arquivo antes de enviar ── */}
              {pendingFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="bg-[#0d1729] border border-white/10 rounded-2xl p-5 w-[92vw] max-w-sm space-y-4 shadow-elevated">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Enviar arquivo</span>
                      <button onClick={() => { URL.revokeObjectURL(pendingFile.previewUrl); setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="size-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-white/[0.06] transition-colors">
                        <X className="size-4" />
                      </button>
                    </div>
                    {/* Preview */}
                    {pendingFile.file.type.startsWith("image/") ? (
                      <img src={pendingFile.previewUrl} alt="" className="w-full max-h-64 object-contain rounded-xl bg-black/30" />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] rounded-xl border border-white/[0.08]">
                        <span className="text-2xl">📄</span>
                        <span className="text-sm text-ink-300 truncate">{pendingFile.file.name}</span>
                      </div>
                    )}
                    {/* Legenda / mensagem */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const f = pendingFile;
                            setPendingFile(null);
                            sendFile(f.file, draft.trim());
                          }
                        }}
                        placeholder="Adicionar legenda..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const f = pendingFile;
                          setPendingFile(null);
                          sendFile(f.file, draft.trim());
                        }}
                        disabled={uploadingFile}
                        className="size-10 rounded-xl flex items-center justify-center text-bg shrink-0 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
                        {uploadingFile ? <RefreshCw className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Header da conversa */}
              <div className="border-b border-white/[0.06] backdrop-blur-xl bg-white/[0.02]">
                <div className="h-16 flex items-center px-5 gap-3">
                  <Avatar src={activeChat.profile_pic_url}
                    name={activeChat.name || activeChat.phone} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {activeChat.name || `+${activeChat.phone}`}
                    </div>
                    {/* Sub-linha: canal + status operacional + respondendo como + interação */}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <ChannelBadge slot={activeChat.slot} />
                      {/* Estado operacional */}
                      {(() => {
                        const st = chatStatus(activeChat);
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium"
                            style={{ color: st.dot }}>
                            <span className="size-1.5 rounded-full" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                        );
                      })()}
                      {activeChat.lead_tag && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-semibold"
                          style={{ color: "#F59E0B", borderColor: "#F59E0B40", background: "#F59E0B15" }}>
                          🏷 {activeChat.lead_tag}
                        </span>
                      )}
                      <span className="text-[10px] text-ink-500 hidden lg:inline">
                        · {fmtRelative(activeChat.last_message_at)}
                      </span>
                    </div>
                  </div>

                  {/* Sync status — topo direito */}
                  <div className="hidden md:flex items-center mr-1">
                    <AnimatePresence mode="wait">
                      {syncStatus === "syncing" && (
                        <motion.span key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-[10px] text-ink-500">
                          <RefreshCw className="size-3 animate-spin" /> Sincronizando
                        </motion.span>
                      )}
                      {syncStatus === "updated" && (
                        <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-[10px] text-primary">
                          <span className="size-1.5 rounded-full bg-primary" /> Atualizado agora
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/leads?q=${activeChat.phone}`} title="Ver no CRM"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-white/10 text-ink-300 hover:text-ink-100 hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <Users className="size-3.5" /> <span className="hidden lg:inline">CRM</span>
                    </Link>
                    <Link href="/dashboard/campanhas" title="Criar campanha"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-white/10 text-ink-300 hover:text-ink-100 hover:border-secondary/30 hover:bg-secondary/5 transition-all">
                      <Megaphone className="size-3.5" /> <span className="hidden lg:inline">Campanha</span>
                    </Link>
                    <a href={`https://wa.me/${activeChat.phone}`} target="_blank" rel="noreferrer"
                      title="Abrir no WhatsApp Web"
                      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-white/10 text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition-all">
                      <ExternalLink className="size-3.5" />
                    </a>
                    <div className="relative">
                      <button
                        onClick={() => setMoreMenuOpen((v) => !v)}
                        title="Mais opções"
                        className="size-8 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-200 hover:bg-white/[0.04] transition-all">
                        <MoreHorizontal className="size-4" />
                      </button>
                      {moreMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMoreMenuOpen(false)} />
                          <div className="absolute right-0 top-10 z-40 w-48 rounded-xl border border-white/[0.08] bg-[#0B1120] shadow-elevated py-1 animate-scale-in">
                            <button onClick={markUnread}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition-colors">
                              <MessageSquare className="size-3.5" /> Marcar como não lido
                            </button>
                            <button onClick={() => { navigator.clipboard?.writeText(`+${activeChat?.phone}`); setMoreMenuOpen(false); setToast({ msg: "Número copiado", duration: 1500 }); }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition-colors">
                              <Copy className="size-3.5" /> Copiar número
                            </button>
                            <a href={`https://wa.me/${activeChat?.phone}`} target="_blank" rel="noreferrer"
                              onClick={() => setMoreMenuOpen(false)}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition-colors">
                              <ExternalLink className="size-3.5" /> Abrir no WhatsApp Web
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Respondendo como — badge compacta abaixo do header */}
                <div className="px-5 pb-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] text-ink-600">
                    Via
                    <span className="inline-flex items-center gap-1 font-semibold ml-0.5" style={{ color: replyColor.hex }}>
                      <span className="size-1.5 rounded-full" style={{ background: replyColor.hex }} />
                      {activeSession?.phone ? `+${activeSession.phone}` : replyColor.name}
                    </span>
                  </span>
                  <span className="text-[10px] text-ink-600 lg:hidden">
                    · {fmtRelative(activeChat.last_message_at)}
                  </span>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "22px 22px" }}>
                {!msgs.length ? (
                  <div className="text-center text-sm text-ink-500 my-12">
                    Sem mensagens ainda. Mande a primeira 👇
                  </div>
                ) : msgs.map((m, i) => {
                  if (!m.text && !m.media_url && (m.type === "other" || !m.type)) return null;
                  const prev    = msgs[i - 1];
                  const showDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString();
                  const out     = m.direction === "out";
                  return (
                    <div key={m.id || m.wa_id || i}>
                      {showDay && (
                        <div className="flex justify-center my-3">
                          <span className="text-[10px] uppercase tracking-wider text-ink-500 bg-white/5 px-3 py-1 rounded-full">
                            {fmtDayHeader(m.timestamp)}
                          </span>
                        </div>
                      )}
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                          out ? "ml-auto rounded-br-sm text-ink-50" : "rounded-bl-sm bg-[#1b2536] border border-white/[0.06]"
                        }`}
                        style={out ? { background: "linear-gradient(135deg,rgba(0,255,136,0.18),rgba(0,209,255,0.12))", border: "1px solid rgba(0,255,136,0.25)" } : undefined}>
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
                            m.status === "failed"  ? <X className="size-3 text-red-400" />
                            : m.status === "pending" ? <Clock className="size-3" />
                            : m.status === "read"    ? <CheckCheck className="size-3 text-primary" />
                            : m.status === "sent"    ? <Check className="size-3" />
                            : <CheckCheck className="size-3" />
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={msgsEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/[0.06] px-4 py-3 bg-white/[0.02]">
                {activeChat?.slot === 0 && (
                  <div className="mb-2 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-[11px] text-accent-blue flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-accent-blue shrink-0" />
                    Canal Oficial · texto e mídia só na janela de 24h. Para iniciar a conversa, use um template aprovado.
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  {/* Ícones esquerdos */}
                  <div className="flex items-center gap-1 pb-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.zip"
                      onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPendingFile({ file: f, previewUrl: URL.createObjectURL(f) });
              }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="size-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-200 hover:bg-white/[0.05] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Anexar arquivo"
                    >
                      {uploadingFile ? <RefreshCw className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
                    </button>
                    <button className="size-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-200 hover:bg-white/[0.05] transition-colors" title="Emoji">
                      <span className="text-[15px] leading-none">😊</span>
                    </button>
                    <button
                      onClick={suggestAI}
                      disabled={aiLoading}
                      className="flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] font-semibold text-accent-blue hover:bg-accent-blue/10 transition-colors disabled:opacity-40"
                      title="Sugestão de resposta por IA">
                      {aiLoading ? <RefreshCw className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />} IA
                    </button>
                  </div>

                  {/* Textarea */}
                  <div className="relative flex-1 group/input">
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Digite uma mensagem..."
                      rows={1}
                      style={{ minHeight: 44, maxHeight: 120 }}
                      className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_20px_-10px_rgba(0,255,136,0.4)] resize-none transition-all" />
                    {/* Dica de atalho — aparece no hover quando vazio */}
                    {!draft && (
                      <span className="absolute right-3 bottom-2.5 text-[10px] text-ink-700 pointer-events-none opacity-0 group-hover/input:opacity-100 transition-opacity duration-150 select-none">
                        ↵ enviar · Shift+↵ nova linha
                      </span>
                    )}
                  </div>

                  {/* Enviar */}
                  <button onClick={send} disabled={!draft.trim() || sending}
                    className="mb-0.5 size-11 rounded-xl flex items-center justify-center text-bg disabled:opacity-40 hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg"
                    style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }} aria-label="Enviar">
                    {sending ? <Clock className="size-4" /> : <SendIcon className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            PAINEL LATERAL DE CONTATO
        ══════════════════════════════════════════════════ */}
        <aside className="hidden xl:flex flex-col border-l border-white/[0.06] min-h-0 overflow-y-auto"
          style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)" }}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <p className="text-xs text-ink-600">Selecione uma conversa para ver os dados do contato</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div className="text-sm font-semibold text-ink-300">Dados do contato</div>

              {/* Avatar + nome */}
              <div className="text-center">
                <div className="inline-block">
                  <Avatar src={activeChat.profile_pic_url}
                    name={activeChat.name || activeChat.phone} size={76} />
                </div>
                <div className="mt-3 font-bold text-base">{activeChat.name || `+${activeChat.phone}`}</div>
                {/* Canal em destaque — grande, logo abaixo do nome */}
                {(() => {
                  const c = slotColor(activeChat.slot);
                  const sess = connectedSessions.find((s) => s.slot === activeChat.slot);
                  return (
                    <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border"
                      style={{ color: c.hex, borderColor: `${c.hex}40`, background: `${c.hex}12` }}>
                      <span className="size-2 rounded-full" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}80` }} />
                      Atendido pelo {c.label}
                      {sess?.phone && <span className="opacity-60 text-[11px]">···{sess.phone.slice(-4)}</span>}
                    </div>
                  );
                })()}
                {activeChat.lead_tag && (
                  <div className="mt-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                      style={{ color: "#F59E0B", background: "#F59E0B15", border: "1px solid #F59E0B40" }}>
                      🏷 {activeChat.lead_tag}
                    </span>
                  </div>
                )}
              </div>

              {/* Telefone */}
              <button onClick={copyPhone}
                className="w-full flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 transition-colors group">
                <span className="size-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Phone className="size-4 text-primary" />
                </span>
                <span className="flex-1 text-left text-sm tabular-nums">+{activeChat.phone}</span>
                {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4 text-ink-500 group-hover:text-ink-200" />}
              </button>

              {/* Informações */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Informações</div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Última interação", fmtRelative(activeChat.last_message_at) || "—"],
                    ["Não lidas",        String(activeChat.unread || 0)],
                    ["Origem",           activeChat.origin || "WhatsApp"],
                    ["Criado em",        fmtTime(activeChat.created_at) || "—"],
                    ...(activeChat.last_campaign ? [["Última campanha", activeChat.last_campaign]] : []),
                    ...(activeChat.lead_score    ? [["Lead score",      `${activeChat.lead_score}/100`]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3">
                      <span className="text-ink-500 text-[11px] shrink-0">{k}</span>
                      <span className="text-ink-100 text-[11px] font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>
                {/* Tags do contato */}
                {activeChat.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {activeChat.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] text-ink-400 border border-white/[0.06]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico */}
              {(activeChat.total_messages || activeChat.campaigns_received) && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Histórico</div>
                  <div className="space-y-2.5">
                    {activeChat.total_messages && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-ink-500 text-xs">Total de interações</span>
                        <span className="text-ink-100 text-xs font-medium">{activeChat.total_messages} mensagens</span>
                      </div>
                    )}
                    {activeChat.campaigns_received && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-ink-500 text-xs">Campanhas recebidas</span>
                        <span className="text-ink-100 text-xs font-medium">{activeChat.campaigns_received} campanhas</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/dashboard/leads?q=${activeChat.phone}`}
                    className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline">
                    Ver histórico completo <ExternalLink className="size-3" />
                  </Link>
                </div>
              )}

              {/* Ações */}
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/dashboard/leads?q=${activeChat.phone}`}
                  className="flex flex-col items-center gap-1 text-center text-[11px] font-semibold text-primary border border-primary/30 rounded-xl py-3 hover:bg-primary/10 transition-colors">
                  <Users className="size-4" /> Ver no CRM
                </Link>
                <Link href="/dashboard/campanhas"
                  className="flex flex-col items-center gap-1 text-center text-[11px] font-semibold text-secondary border border-secondary/30 rounded-xl py-3 hover:bg-secondary/10 transition-colors">
                  <Megaphone className="size-4" /> Campanha
                </Link>
              </div>

              {/* Ações rápidas */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Ações rápidas</div>
                <div className="space-y-0.5">
                  {[
                    {
                      href: `https://wa.me/${activeChat.phone}`,
                      external: true,
                      icon: <ExternalLink className="size-3.5" />,
                      iconBg: "bg-primary/15 text-primary",
                      label: "Abrir no WhatsApp Web",
                      tip: "Abre esta conversa no WhatsApp Web",
                    },
                    {
                      href: `/dashboard/crm?phone=${activeChat.phone}`,
                      icon: <Zap className="size-3.5" />,
                      iconBg: "bg-secondary/15 text-secondary",
                      label: "Ver no CRM",
                      tip: "Abrir este contato no pipeline do CRM",
                    },
                    {
                      onClick: () => {},
                      icon: <Tag className="size-3.5" />,
                      iconBg: "bg-accent-blue/15 text-accent-blue",
                      label: "Adicionar tag",
                      tip: "Adicionar etiqueta a este contato",
                    },
                    {
                      href: "/dashboard/campanhas",
                      icon: <Megaphone className="size-3.5" />,
                      iconBg: "bg-amber-400/15 text-amber-400",
                      label: "Enviar campanha",
                      tip: "Criar campanha para este número",
                    },
                  ].map(({ href, external, onClick, icon, iconBg, label, tip }) => {
                    const cls = "group/action flex items-center gap-2.5 text-[11px] text-ink-400 hover:text-ink-100 hover:bg-white/[0.04] transition-all rounded-lg px-2 py-2 w-full text-left";
                    const inner = (
                      <>
                        <span className={`size-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${iconBg}`}>{icon}</span>
                        <span className="flex-1">{label}</span>
                        <span className="opacity-0 group-hover/action:opacity-100 text-[9px] text-ink-600 transition-opacity hidden xl:block" title={tip}>?</span>
                      </>
                    );
                    if (onClick) return <button key={label} onClick={onClick} className={cls} title={tip}>{inner}</button>;
                    if (external) return <a key={label} href={href} target="_blank" rel="noreferrer" className={cls} title={tip}>{inner}</a>;
                    return <Link key={label} href={href} className={cls} title={tip}>{inner}</Link>;
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════
          MODAL — NOVA CONVERSA
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {newChatOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="nc-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => { if (!newChatSending) { setNewChatOpen(false);  } }}
            />
            {/* Painel */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              key="nc-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto w-[92vw] max-w-md rounded-2xl border border-white/[0.1] bg-[#0d1729] shadow-elevated p-6 space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-base">Nova Conversa</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Inicie um chat com qualquer número</p>
                </div>
                <button onClick={() => { if (!newChatSending) { setNewChatOpen(false);  } }}
                  className="size-8 rounded-xl border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-200 hover:bg-white/[0.04] transition-all">
                  <X className="size-4" />
                </button>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Nome do contato</label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Ex: João Silva"
                  disabled={newChatSending}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600"
                  autoFocus
                  autoComplete="off"
                />
              </div>

              {/* Número com autocomplete */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Número (com DDI + DDD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500 select-none">+</span>
                  <input
                    type="tel"
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value.replace(/[^\d\s\-\(\)]/g, ""))}
                    placeholder="55 11 91234-5678"
                    className="w-full pl-6 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600"
                    disabled={newChatSending}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Canal */}
              {connectedSessions.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Canal de envio</label>
                  <div className="flex flex-wrap gap-2">
                    {connectedSessions.map((s) => {
                      const c = slotColor(s.slot);
                      const active = (newChatSlot ?? connectedSessions[0]?.slot) === s.slot;
                      return (
                        <button key={s.slot} onClick={() => setNewChatSlot(s.slot)}
                          disabled={newChatSending}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                          style={active
                            ? { borderColor: `${c.hex}50`, background: `${c.hex}15`, color: c.hex }
                            : { borderColor: "rgba(255,255,255,0.08)", color: "#6B7280" }}>
                          <span className="size-2 rounded-full" style={{ background: active ? c.hex : "#4B5563" }} />
                          {s.phone ? `+${s.phone}` : c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensagem */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide">Mensagem inicial</label>
                <textarea
                  value={newChatMsg}
                  onChange={(e) => setNewChatMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); startNewChat(); } }}
                  placeholder="Olá! Tudo bem?"
                  rows={3}
                  disabled={newChatSending}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-primary/50 transition-colors resize-none placeholder:text-ink-600"
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { if (!newChatSending) { setNewChatOpen(false);  } }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-ink-400 hover:text-ink-200 hover:bg-white/[0.04] transition-all">
                  Cancelar
                </button>
                <button onClick={startNewChat} disabled={newChatSending || !newChatPhone.trim() || !newChatMsg.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)", color: "#0B1120" }}>
                  {newChatSending
                    ? <><span className="size-4 border-2 border-[#0B1120]/40 border-t-[#0B1120] rounded-full animate-spin" /> Enviando…</>
                    : <><SendIcon className="size-4" /> Enviar</>}
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
