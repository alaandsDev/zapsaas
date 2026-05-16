"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "../Logo";
import { getUser } from "../../lib/api";

const SECTIONS = [
  {
    title: "Operação",
    items: [
      { href: "/dashboard", label: "Central", icon: "M3 12l9-9 9 9v9a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" },
      { href: "/dashboard/workflow", label: "Workflow", icon: "M5 6a3 3 0 116 0 3 3 0 01-6 0zm0 12a3 3 0 116 0 3 3 0 01-6 0zm14-6a3 3 0 11-6 0 3 3 0 016 0zM8 9v6m3-9h2a3 3 0 013 3m-6 6h2a3 3 0 003-3", badge: "novo" },
      { href: "/dashboard/disparos", label: "Disparos", icon: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
      { href: "/dashboard/conversas", label: "Conversas", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
    ],
  },
  {
    title: "Crescimento",
    items: [
      { href: "/dashboard/relatorios", label: "Relatórios", icon: "M3 3v18h18M7 14l4-4 3 3 5-6" },
      { href: "/dashboard/automacao", label: "Automação", icon: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" },
      { href: "/dashboard/contatos", label: "Contatos", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
    ],
  },
  {
    title: "Conta",
    items: [
      { href: "/dashboard/configuracoes", label: "Configurações", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 00-2-1.2L14.5 3h-5l-.4 2.5a7.5 7.5 0 00-2 1.2l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 002 1.2l.4 2.5h5l.4-2.5a7.5 7.5 0 002-1.2l2.4.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2z" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  useEffect(() => setUser(getUser()), []);

  const isActive = (href) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-bg/60 backdrop-blur-xl h-screen sticky top-0 flex flex-col">
      <div className="px-6 h-16 flex items-center border-b border-white/[0.06]">
        <Link href="/dashboard"><Logo /></Link>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      active ? "text-primary" : "text-ink-300 hover:text-ink-100"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/25 shadow-[0_0_22px_-8px_rgba(0,255,136,0.7)]"
                      />
                    )}
                    {!active && (
                      <span className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.04] transition-colors" />
                    )}
                    {active && (
                      <motion.span
                        layoutId="sidebar-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary shadow-[0_0_10px_rgba(0,255,136,0.9)]"
                      />
                    )}
                    <svg
                      className="relative size-4 transition-transform group-hover:scale-110"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={item.icon} />
                    </svg>
                    <span className="relative font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="relative ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-accent-purple/25 text-accent-purple border border-accent-purple/40">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-ink-500">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Sistema operacional
        </div>
        <Link
          href="/dashboard/configuracoes"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-primary/30 hover:bg-white/[0.04] transition-colors"
        >
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent-purple text-bg font-bold flex items-center justify-center text-sm">
            {(user?.name || user?.email || "Z")[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || "Minha conta"}</div>
            <div className="text-xs text-ink-500 truncate">{user?.email || "Ver detalhes"}</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
