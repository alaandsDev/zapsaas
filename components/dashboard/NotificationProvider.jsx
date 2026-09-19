"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { API_URL, getToken } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X } from "lucide-react";

/* ── Web Audio beep (sem arquivo externo) ── */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {}
}

/* ── título da aba com badge ── */
const BASE_TITLE = "Wayvo — Painel";
let unreadCount = 0;
function bumpTitle() {
  unreadCount += 1;
  document.title = `(${unreadCount}) ${BASE_TITLE}`;
}
function clearTitle() {
  unreadCount = 0;
  document.title = BASE_TITLE;
}

/* ── banner para pedir permissão ── */
function PermissionBanner({ onAllow, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 shadow-2xl text-sm max-w-sm w-full"
      style={{ background: "rgba(11,17,32,0.97)", backdropFilter: "blur(20px)" }}
    >
      <div className="size-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
        <Bell className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink-100 text-xs">Ativar notificações</p>
        <p className="text-ink-400 text-[11px] mt-0.5">Seja avisado quando chegar nova mensagem, mesmo em outra aba.</p>
      </div>
      <button
        onClick={onAllow}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-bg shrink-0"
        style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}
      >
        Ativar
      </button>
      <button onClick={onDismiss} className="text-ink-500 hover:text-ink-300 shrink-0">
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

/* ── banner para quando está bloqueada ── */
function BlockedBanner({ onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/20 shadow-2xl text-sm max-w-md w-full"
      style={{ background: "rgba(11,17,32,0.97)", backdropFilter: "blur(20px)" }}
    >
      <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
        <BellOff className="size-4 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink-100 text-xs">Notificações bloqueadas</p>
        <p className="text-ink-400 text-[11px] mt-0.5">
          Clique no <strong className="text-ink-200">🔒 cadeado</strong> na barra do navegador → <strong className="text-ink-200">Notificações → Permitir</strong>
        </p>
      </div>
      <button onClick={onDismiss} className="text-ink-500 hover:text-ink-300 shrink-0">
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

export default function NotificationProvider() {
  const esRef = useRef(null);
  const [permission, setPermission] = useState("default");
  const [showBanner, setShowBanner] = useState(false);
  const [showBlockedBanner, setShowBlockedBanner] = useState(false);
  const [msgToasts, setMsgToasts] = useState([]); // [{ id, phone, name, text, chatId }]
  const focusedRef = useRef(true);

  /* track tab focus */
  useEffect(() => {
    const onFocus = () => { focusedRef.current = true; clearTitle(); };
    const onBlur  = () => { focusedRef.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur",  onBlur);
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("blur", onBlur); };
  }, []);

  /* check current permission + decide whether to show banner */
  useEffect(() => {
    if (!("Notification" in window)) return;
    const perm = Notification.permission;
    setPermission(perm);
    if (perm === "default") {
      setShowBanner(true);
    } else if (perm === "denied") {
      setShowBlockedBanner(true);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setShowBanner(false);
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "denied") setShowBlockedBanner(true);
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const dismissToast = useCallback((id) => {
    setMsgToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* fire notification + sound */
  const notify = useCallback((phone, text, name, chatId) => {
    playBeep();
    bumpTitle();
    // Popup in-app (sempre visível)
    const id = `${Date.now()}_${Math.random()}`;
    setMsgToasts((prev) => [...prev.slice(-2), { id, phone, name, text, chatId }]);
    setTimeout(() => dismissToast(id), 6000);
    // Notificação do browser (só quando aba desfocada)
    if (permission === "granted" && !focusedRef.current) {
      try {
        const n = new Notification("Nova mensagem — Wayvo", {
          body: text ? `${name || phone}: ${text.slice(0, 80)}` : `Mensagem de ${name || phone}`,
          icon: "/icon-192.png",
          tag: `wayvo-msg-${phone}`,
          renotify: true,
          silent: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }
  }, [permission, dismissToast]);

  /* SSE global — 1 conexão para o app inteiro */
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Evita duplicar se já existe uma conexão ativa
    if (esRef.current) return;

    const es = new EventSource(`${API_URL}/api/chats/stream?token=${token}`);
    esRef.current = es;

    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        // O evento SSE 'message' carrega mensagens de chat (type = 'text'|'image'|etc.)
        // ou eventos de sistema (type = 'profile_pic'|'chat_unread'|'lead_stage')
        if (data.chatId) {
          // Mensagem de chat — notifica e atualiza sidebar
          if (data.direction === "in") notify(data.phone || "cliente", data.text || "", data.name || null, data.chatId);
          window.dispatchEvent(new CustomEvent("wayvo:new-message", { detail: data }));
        } else if (data.type === "profile_pic") {
          window.dispatchEvent(new CustomEvent("wayvo:profile-pic", { detail: data }));
        } else if (data.type === "chat_unread") {
          window.dispatchEvent(new CustomEvent("wayvo:chat-unread", { detail: data }));
        } else if (data.type === "lead_stage") {
          window.dispatchEvent(new CustomEvent("wayvo:lead-stage", { detail: data }));
        }
      } catch {}
    });

    // Atualização de status de entrega de mensagem (✓ sent → ✓✓ delivered → ✓✓ read)
    es.addEventListener("message_status", (e) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent("wayvo:message-status", { detail: data }));
      } catch {}
    });

    // Repassa eventos de status de conexão WhatsApp
    es.addEventListener("connection", (e) => {
      try {
        const data = JSON.parse(e.data);
        window.dispatchEvent(new CustomEvent("wayvo:connection-update", { detail: data }));
      } catch {}
    });

    es.onerror = () => {
      // reconecta automaticamente (EventSource faz isso nativamente)
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [notify]);

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <PermissionBanner onAllow={requestPermission} onDismiss={dismissBanner} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockedBanner && (
          <BlockedBanner onDismiss={() => setShowBlockedBanner(false)} />
        )}
      </AnimatePresence>

      {/* Popups de nova mensagem — sobem do canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence>
          {msgToasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border border-white/10 shadow-2xl w-80 cursor-pointer"
              style={{ background: "rgba(11,17,32,0.97)", backdropFilter: "blur(20px)" }}
              onClick={() => {
                dismissToast(t.id);
                if (t.chatId) window.dispatchEvent(new CustomEvent("wayvo:open-chat", { detail: { chatId: t.chatId } }));
              }}
            >
              <div className="size-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
                {(t.name || t.phone || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{t.name || t.phone}</p>
                <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2 break-words">{t.text || "Nova mensagem"}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                className="text-white/30 hover:text-white/70 shrink-0 mt-0.5"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
