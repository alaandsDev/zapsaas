"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, MessageSquare, Users, DollarSign, Megaphone,
  Workflow, Radio, BadgeCheck, LifeBuoy, Settings2, Pin, Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { api } from "../../lib/api";

const SECTIONS = [
  {
    title: "Operacional",
    items: [
      { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, exact: true },
      { href: "/dashboard/conversas", label: "Conversas", Icon: MessageSquare },
      { href: "/dashboard/leads", label: "Leads", Icon: Users },
      { href: "/dashboard/vendas", label: "Vendas", Icon: DollarSign },
    ],
  },
  {
    title: "Automação",
    items: [
      { href: "/dashboard/campanhas", label: "Campanhas", Icon: Megaphone },
      { href: "/dashboard/workflow", label: "Workflow", Icon: Workflow, highlight: true },
    ],
  },
  {
    title: "Infraestrutura",
    items: [
      { href: "/dashboard/canais", label: "Canais", Icon: Radio },
      { href: "/dashboard/canal-oficial", label: "Canal Oficial", Icon: BadgeCheck },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/dashboard/suporte", label: "Suporte", Icon: LifeBuoy },
      { href: "/dashboard/configuracoes", label: "Equipe", Icon: Users },
    ],
  },
];
const ALL = SECTIONS.flatMap((s) => s.items);
// Itens principais no mobile (máx 5 sem scroll)
const MOBILE_PRIMARY = [
  "/dashboard",
  "/dashboard/conversas",
  "/dashboard/leads",
  "/dashboard/campanhas",
  "/dashboard/workflow",
];

export default function Sidebar() {
  const pathname = usePathname();
  const [usage, setUsage] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);

  useEffect(() => { api("/api/usage").then(setUsage).catch(() => {}); }, [pathname]);
  useEffect(() => { if (localStorage.getItem("sidebar_pinned") === "1") setPinned(true); }, []);
  useEffect(() => { localStorage.setItem("sidebar_pinned", pinned ? "1" : "0"); }, [pinned]);

  const expanded = pinned || hover;
  const floating = hover && !pinned;
  const isPro = usage?.plan === "pro";
  const used = usage?.dispatches?.used ?? 0;
  const limit = usage?.dispatches?.limit ?? 3;
  const pct = isPro ? 100 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  const isActive = (it) => (it.exact ? pathname === it.href : pathname.startsWith(it.href));

  const openCopilot = () => window.dispatchEvent(new CustomEvent("wayvo:open-copilot"));
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const mobilePrimary = ALL.filter((it) => MOBILE_PRIMARY.includes(it.href));
  const mobileSecondary = ALL.filter((it) => !MOBILE_PRIMARY.includes(it.href));

  const NavLink = ({ item }) => {
    const active = isActive(item);
    const { Icon } = item;
    return (
      <Link
        href={item.href}
        title={!expanded ? item.label : undefined}
        className={`group relative flex items-center gap-3 rounded-xl text-sm transition-all duration-150
          ${expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
          ${active ? "text-primary" : "text-ink-300 hover:text-ink-50"}`}
      >
        {active && (
          <>
            <span className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary shadow-[0_0_10px_rgba(0,255,136,0.7)]" />
          </>
        )}
        {!active && <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-colors" />}
        <Icon className={`relative size-[18px] shrink-0 transition-transform group-hover:scale-110 ${item.highlight && !active ? "text-secondary" : ""}`} />
        {expanded && (
          <span className="relative font-medium whitespace-nowrap overflow-hidden flex-1">{item.label}</span>
        )}
        {expanded && item.highlight && !active && (
          <span className="relative badge-purple text-[9px] py-0 px-1.5">PRO</span>
        )}
      </Link>
    );
  };

  return (
    <>
      <div className={`hidden md:block shrink-0 transition-[width] duration-300 ease-out ${pinned ? "w-64" : "w-16"}`} aria-hidden="true" />

      <aside
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-white/[0.06] bg-bg/95 backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-out
          ${expanded ? "w-64" : "w-16"} ${floating ? "shadow-elevated" : ""}`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/[0.06] gap-2 ${expanded ? "px-4 justify-between" : "px-0 justify-center"}`}>
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <img src="/wayvo-icon.png" alt="Wayvo" width={28} height={28}
              className="size-7 object-contain shrink-0 select-none" draggable={false} />
            {expanded && <span className="font-black text-base tracking-tight whitespace-nowrap">Wayvo</span>}
          </Link>
          {expanded && (
            <button
              onClick={() => setPinned((v) => !v)}
              className={`size-8 flex items-center justify-center rounded-lg transition-all ${pinned ? "bg-primary/15 text-primary" : "hover:bg-white/[0.04] text-ink-400 hover:text-ink-200"}`}
              title={pinned ? "Desafixar" : "Fixar menu"}
            >
              <Pin className={`size-4 transition-transform ${pinned ? "rotate-45" : ""}`} />
            </button>
          )}
        </div>

        {/* AI Copilot launcher */}
        <div className="px-2 pt-3">
          <button
            onClick={openCopilot}
            title={!expanded ? "Wayvo AI" : undefined}
            className={`w-full group relative overflow-hidden flex items-center gap-2.5 rounded-xl border border-secondary/30 transition-all
              ${expanded ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
            style={{ background: "linear-gradient(120deg, rgba(124,58,237,0.18), rgba(0,209,255,0.08))" }}
          >
            <span className="absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: "inset 0 0 0 1px rgba(124,58,237,0.5)" }} />
            <Sparkles className="relative size-[18px] text-secondary shrink-0" />
            {expanded && (
              <span className="relative flex-1 text-left">
                <span className="block text-[13px] font-semibold text-ink-50">Wayvo AI</span>
                <span className="block text-[10px] text-ink-400">Copiloto operacional</span>
              </span>
            )}
            {expanded && <kbd className="relative text-[10px] text-ink-400 border border-white/10 rounded px-1">⌘K</kbd>}
          </button>
        </div>

        {/* Nav por categorias */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-4">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              {expanded ? (
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">{sec.title}</div>
              ) : (
                <div className="mx-3 mb-1.5 h-px bg-white/[0.06]" />
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => <NavLink key={item.href} item={item} />)}
              </div>
            </div>
          ))}
        </nav>

        {/* Plan footer */}
        <div className="shrink-0 p-2 border-t border-white/[0.06]">
          {isPro ? (
            <Link href="/dashboard/configuracoes"
              title={!expanded ? "Plano Pro" : undefined}
              className={`flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors ${expanded ? "px-3 py-2.5" : "p-2.5 justify-center"}`}>
              <div className="size-6 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5 text-bg" />
              </div>
              {expanded && <span className="text-sm font-bold text-primary">Plano Pro</span>}
            </Link>
          ) : expanded ? (
            <Link href="/dashboard/configuracoes" className="block px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink-200">Plano Gratuito</span>
                <span className="text-[10px] text-primary font-bold">Upgrade →</span>
              </div>
              <div className="text-[10px] text-ink-500 mb-1.5">{used}/{limit} campanhas usadas</div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          ) : (
            <Link href="/dashboard/configuracoes"
              title={`Plano Gratuito · ${used}/${limit}`}
              className="flex items-center justify-center p-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
              <Sparkles className="size-4 text-primary" />
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-bg/95 backdrop-blur-xl">
        {/* Drawer com itens secundários */}
        {mobileExpanded && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileExpanded(false)} />
            <div className="absolute bottom-full inset-x-0 z-50 border-t border-white/[0.06] bg-bg/98 backdrop-blur-xl pb-1">
              <div className="grid grid-cols-4 gap-1 px-2 pt-2 pb-1">
                {mobileSecondary.map((item) => {
                  const active = isActive(item);
                  const { Icon } = item;
                  return (
                    <Link key={item.href} href={item.href}
                      onClick={() => setMobileExpanded(false)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[10px] transition-all
                        ${active ? "text-primary bg-primary/10" : "text-ink-400 hover:text-ink-200 hover:bg-white/[0.04]"}`}>
                      <Icon className="size-5 shrink-0" />
                      <span className="truncate max-w-[56px] text-center">{item.label}</span>
                    </Link>
                  );
                })}
                <button onClick={() => { setMobileExpanded(false); openCopilot(); }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-[10px] text-secondary hover:bg-secondary/10 transition-colors">
                  <Sparkles className="size-5 shrink-0" />
                  <span>Wayvo AI</span>
                </button>
              </div>
            </div>
          </>
        )}
        {/* Barra principal — 5 itens fixos */}
        <div className="flex items-center px-1 py-1.5">
          {mobilePrimary.map((item) => {
            const active = isActive(item);
            const { Icon } = item;
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-all
                  ${active ? "text-primary bg-primary/10" : "text-ink-400"}`}>
                <Icon className="size-5 shrink-0" />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </Link>
            );
          })}
          {/* Botão "Mais" */}
          <button
            onClick={() => setMobileExpanded((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] transition-all
              ${mobileExpanded ? "text-primary bg-primary/10" : "text-ink-400"}`}>
            <MoreHorizontal className="size-5 shrink-0" />
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
