"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, MessageSquare, Users, Send, Phone,
  Zap, Link2, HelpCircle, Settings, ChevronLeft,
  MessageCircle, Sparkles, Pin
} from "lucide-react";
import { api } from "../../lib/api";

const NAV = [
  { href: "/dashboard",            label: "Dashboard",         Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/conversas",  label: "Conversas",         Icon: MessageSquare },
  { href: "/dashboard/leads",      label: "Leads",             Icon: Users },
  { href: "/dashboard/disparos",   label: "Disparos",          Icon: Send },
  { href: "/dashboard/workflow",   label: "Workflow",          Icon: Sparkles, highlight: true },
  { href: "/dashboard/conexoes",   label: "Conexões",          Icon: Link2 },
  { href: "/dashboard/wpp-oficial",label: "WhatsApp Oficial",  Icon: Phone },
  { href: "/dashboard/suporte",    label: "Suporte",           Icon: HelpCircle },
  { href: "/dashboard/minha-conta",label: "Minha Conta",       Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [usage, setUsage] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api("/api/usage").then(setUsage).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const s = localStorage.getItem("sidebar_pinned");
    if (s === "1") setPinned(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_pinned", pinned ? "1" : "0");
  }, [pinned]);

  const expanded = pinned || hover;
  const floating = hover && !pinned;
  const isPro = usage?.plan === "pro";
  const used = usage?.dispatches?.used ?? 0;
  const limit = usage?.dispatches?.limit ?? 3;
  const pct = isPro ? 100 : Math.min(100, (used / Math.max(limit, 1)) * 100);

  return (
    <>
      {/* Spacer */}
      <div className={`hidden md:block shrink-0 transition-[width] duration-300 ease-out ${pinned ? "w-64" : "w-16"}`} aria-hidden="true" />

      {/* Sidebar */}
      <aside
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-ink-700/60 bg-bg/95 backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-out
          ${expanded ? "w-64" : "w-16"}
          ${floating ? "shadow-elevated" : ""}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-ink-700/60 gap-2 ${expanded ? "px-4 justify-between" : "px-0 justify-center"}`}>
          {expanded && (
            <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
              <div className="size-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Zap className="size-4 text-bg" />
              </div>
              <span className="font-black text-base tracking-tight whitespace-nowrap">ZapFlow</span>
            </Link>
          )}
          <button
            onClick={() => setPinned(v => !v)}
            className={`size-9 flex items-center justify-center rounded-lg transition-all ${pinned ? "bg-primary/15 text-primary" : "hover:bg-white/[0.04] text-ink-400 hover:text-ink-200"}`}
            title={pinned ? "Desafixar menu" : "Fixar menu"}
          >
            <Pin className={`size-4 transition-transform ${pinned ? "rotate-45" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const { Icon } = item;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm transition-all duration-150
                  ${expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
                  ${active ? "nav-active" : "nav-inactive"}
                  ${item.highlight && !active ? "text-secondary hover:text-secondary hover:bg-secondary/[0.06]" : ""}
                `}
              >
                <Icon className={`size-5 shrink-0 ${item.highlight && !active ? "text-secondary" : ""}`} />
                {expanded && (
                  <span className="font-medium whitespace-nowrap overflow-hidden flex-1">
                    {item.label}
                  </span>
                )}
                {expanded && item.highlight && !active && (
                  <span className="badge-purple text-[9px] py-0 px-1.5 ml-auto">PRO</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan footer */}
        <div className="shrink-0 p-2 border-t border-ink-700/60 space-y-1">
          {isPro ? (
            <Link href="/dashboard/minha-conta"
              title={!expanded ? "Plano Pro" : undefined}
              className={`flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors ${expanded ? "px-3 py-2.5" : "p-2.5 justify-center"}`}>
              <div className="size-6 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5 text-bg" />
              </div>
              {expanded && <span className="text-sm font-bold text-primary">Plano Pro</span>}
            </Link>
          ) : expanded ? (
            <Link href="/dashboard/minha-conta" className="block px-3 py-2.5 rounded-xl bg-ink-700/40 border border-ink-600 hover:border-ink-500 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink-200">Plano Gratuito</span>
                <span className="text-[10px] text-primary font-bold">Upgrade ⚡</span>
              </div>
              <div className="text-[10px] text-ink-500 mb-1.5">{used}/{limit} disparos usados</div>
              <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          ) : (
            <Link href="/dashboard/minha-conta"
              title={`Plano Gratuito · ${used}/${limit}`}
              className="flex items-center justify-center p-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
              <Sparkles className="size-4 text-primary" />
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-ink-700/60 bg-bg/95 backdrop-blur-xl">
        <div className="flex gap-1 overflow-x-auto px-2 py-2 hide-scrollbar">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const { Icon } = item;
            return (
              <Link key={item.href} href={item.href}
                className={`min-w-[64px] flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] transition-all
                  ${active ? "nav-active" : "nav-inactive"}`}>
                <Icon className="size-5 shrink-0" />
                <span className="truncate max-w-[58px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
