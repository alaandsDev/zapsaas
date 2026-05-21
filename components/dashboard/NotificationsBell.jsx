"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const READ_KEY = "zapflow_notif_read_v1";

// Notificações estáticas (sincronizadas com /changelog).
// Mantenha o id estável — usuário só vê "Novo" se nunca leu aquele id.
const NOTIFS = [
  { id: "v118", date: "2026-05-09", icon: "🎉", title: "Visual high-ticket", desc: "Comparativo de planos, garantia 7 dias e antes/depois.", href: "/changelog" },
  { id: "v117", date: "2026-05-08", icon: "✨", title: "FAQ + Empty states ricos", desc: "Skeletons, FAQ e testimonials com métrica.", href: "/changelog" },
  { id: "v116", date: "2026-05-07", icon: "💬", title: "Conversas em tempo real", desc: "Espelho do WhatsApp Web com SSE e mídia funcional.", href: "/dashboard/conversas" },
  { id: "v115", date: "2026-05-06", icon: "📊", title: "Relatório de disparos + Excel", desc: "Cards clicáveis e export pra Excel com 2 sheets.", href: "/dashboard/campanhas" },
  { id: "v114", date: "2026-05-05", icon: "🚀", title: "Sidebar premium + sem dup. msg", desc: "Hover expand estilo Linear e fim das mensagens duplicadas.", href: "/changelog" },
];

function fmtRel(date) {
  const d = new Date(date + "T12:00:00");
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `${diff}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [readSet, setReadSet] = useState(() => new Set());
  const ref = useRef(null);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
      setReadSet(new Set(arr));
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = NOTIFS.filter((n) => !readSet.has(n.id)).length;

  function markAllRead() {
    const all = new Set(NOTIFS.map((n) => n.id));
    localStorage.setItem(READ_KEY, JSON.stringify([...all]));
    setReadSet(all);
  }

  function markRead(id) {
    const next = new Set(readSet); next.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...next]));
    setReadSet(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="size-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-ink-300 hover:text-ink-100 transition-colors relative"
        aria-label="Notificações"
        title="Novidades"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-bg animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[340px] max-w-[90vw] card overflow-hidden shadow-2xl shadow-black/40 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Novidades</span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-bg">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.04]">
            {NOTIFS.map((n) => {
              const isUnread = !readSet.has(n.id);
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                  className={`flex items-start gap-3 p-3 hover:bg-white/[0.03] transition-colors ${isUnread ? "bg-primary/[0.02]" : ""}`}
                >
                  <div className="size-9 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base">
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${isUnread ? "text-ink-100" : "text-ink-300"}`}>{n.title}</span>
                      {isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5 leading-snug">{n.desc}</p>
                    <p className="text-[10px] text-ink-500 mt-1">{fmtRel(n.date)}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            href="/changelog"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm text-primary border-t border-white/[0.06] hover:bg-primary/[0.05]"
          >
            Ver changelog completo →
          </Link>
        </div>
      )}
    </div>
  );
}
