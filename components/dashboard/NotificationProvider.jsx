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
        <p className="text-ink-400 text-[11px] mt-0.5">Avise quando chegar nova mensagem.</p>
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

const BANNER_DISMISSED_KEY = "wayvo_notif_banner_dismissed";

export default function NotificationProvider() {
  const esRef = useRef(null);
  const [permission, setPermission] = useState("default");
  const [showBanner, setShowBanner] = useState(false);
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
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (perm === "default" && !dismissed) {
      // show banner after 4s so user has time to orient
      const t = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setShowBanner(false);
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try { localStorage.setItem(BANNER_DISMISSED_KEY, "1"); } catch {}
  }, []);

  /* fire notification + sound */
  const notify = useCallback((phone, text) => {
    playBeep();
    bumpTitle();
    if (permission === "granted" && !focusedRef.current) {
      try {
        const n = new Notification("Nova mensagem — Wayvo", {
          body: text ? `${phone}: ${text.slice(0, 80)}` : `Mensagem de ${phone}`,
          icon: "/icon-192.png",
          tag: `wayvo-msg-${phone}`,
          renotify: true,
          silent: true, // já tocamos o beep manualmente
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }
  }, [permission]);

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
        if (data.type === "message") {
          notify(data.phone || "cliente", data.text || "");
          window.dispatchEvent(new CustomEvent("wayvo:new-message", { detail: data }));
        } else if (data.type === "profile_pic") {
          window.dispatchEvent(new CustomEvent("wayvo:profile-pic", { detail: data }));
        } else if (data.type === "chat_unread") {
          window.dispatchEvent(new CustomEvent("wayvo:chat-unread", { detail: data }));
        }
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

  /* Expor indicador de som no header (pequeno ícone) */
  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <PermissionBanner onAllow={requestPermission} onDismiss={dismissBanner} />
        )}
      </AnimatePresence>

      {/* Indicador de status de notificação (canto inferior direito, sutil) */}
      <AnimatePresence>
        {permission === "denied" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.07] text-[11px] text-ink-500 pointer-events-none"
            style={{ background: "rgba(11,17,32,0.7)", backdropFilter: "blur(12px)" }}
          >
            <BellOff className="size-3" />
            Notificações bloqueadas
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
