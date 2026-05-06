"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { api } from "../../lib/api";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l9-9 9 9v9a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" },
  { href: "/dashboard/conversas", label: "Conversas", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
  { href: "/dashboard/leads", label: "Leads", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/dashboard/disparos", label: "Disparos", icon: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
  { href: "/dashboard/sms", label: "SMS", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/dashboard/automacao", label: "Automação", icon: "M9 19c-5 0-8-3-8-8s3-8 8-8h6c5 0 8 3 8 8M7 11h2m6 0h2M5 7h2m6 0h2M5 15h2m6 0h2" },
  { href: "/dashboard/conexoes", label: "Conexões", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { href: "/dashboard/wpp-oficial", label: "WhatsApp Oficial", icon: "M22 11.5a8.5 8.5 0 0 1-8.5 8.5h-.5l-5 3v-3.5A8.5 8.5 0 1 1 22 11.5zM9 11h6m-3-3v6" },
  { href: "/dashboard/suporte", label: "Suporte", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" },
  { href: "/dashboard/minha-conta", label: "Minha Conta", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 00-2-1.2L14.5 3h-5l-.4 2.5a7.5 7.5 0 00-2 1.2l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 002 1.2l.4 2.5h5l.4-2.5a7.5 7.5 0 002-1.2l2.4.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2z" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [usage, setUsage] = useState(null);
  // pinned = expandida fixa (botão clicado); hover = expandida temporária por mouse
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api("/api/usage").then(setUsage).catch(() => {});
  }, [pathname]);

  // Restaura preferência (pinned)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_pinned");
    if (saved === "1") setPinned(true);
  }, []);

  // Persiste preferência
  useEffect(() => {
    localStorage.setItem("sidebar_pinned", pinned ? "1" : "0");
  }, [pinned]);

  const expanded = pinned || hover;

  const isPro = usage?.plan === "pro";
  const used = usage?.dispatches?.used ?? 0;
  const limit = usage?.dispatches?.limit ?? 3;
  const pct = isPro ? 100 : Math.min(100, (used / Math.max(limit, 1)) * 100);

  return (
    <>
      <aside
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`hidden md:flex shrink-0 border-r border-white/[0.06] bg-bg/50 backdrop-blur-sm h-screen sticky top-0 flex-col transition-[width] duration-300 ease-out ${expanded ? "w-64" : "w-16"}`}
      >
        <div className={`h-16 flex items-center border-b border-white/[0.06] gap-2 ${expanded ? "px-4 justify-between" : "px-0 justify-center"}`}>
          {expanded && <Link href="/dashboard"><Logo /></Link>}
          <button
            onClick={() => setPinned((v) => !v)}
            className={`size-9 flex items-center justify-center rounded-lg transition-colors ${pinned ? "bg-primary/15 text-primary" : "hover:bg-white/5 text-ink-300 hover:text-ink-100"}`}
            aria-label={pinned ? "Desafixar menu" : "Fixar menu aberto"}
            title={pinned ? "Desafixar (volta a recolher no hover)" : "Fixar menu aberto"}
          >
            {/* ícone de pin */}
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z" fill={pinned ? "currentColor" : "none"} />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {nav.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm transition-all ${expanded ? "px-3 py-2" : "px-0 py-2 justify-center"} ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-ink-300 hover:text-ink-100 hover:bg-white/5 border border-transparent"
                }`}
              >
                <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {expanded && <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 p-2 border-t border-white/[0.06]">
          {isPro ? (
            <Link
              href="/dashboard/minha-conta"
              title={!expanded ? "Plano Pro" : undefined}
              className={`flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors ${expanded ? "px-2 py-2" : "p-2 justify-center"}`}
            >
              <div className="size-6 shrink-0 rounded-md bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-[10px]">⚡</div>
              {expanded && <div className="text-xs font-semibold text-primary">Plano Pro</div>}
            </Link>
          ) : expanded ? (
            <Link href="/dashboard/minha-conta" className="block px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
              <div className="text-xs font-semibold text-primary truncate">Plano Gratuito</div>
              <div className="text-[10px] text-ink-400 mt-0.5">{used}/{limit} disparos · upgrade ⚡</div>
              <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          ) : (
            <Link
              href="/dashboard/minha-conta"
              title={`Plano Gratuito · ${used}/${limit}`}
              className="flex items-center justify-center p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <span className="text-base">⚡</span>
            </Link>
          )}
        </div>
      </aside>

      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-bg/95 backdrop-blur-xl">
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {nav.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-w-[70px] flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] transition-colors ${
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-ink-300 border border-transparent"
                }`}
              >
                <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span className="max-w-[62px] truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
