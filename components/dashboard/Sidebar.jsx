"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../Logo";

const nav = [
  { href: "/dashboard", label: "Início", icon: "M3 12l9-9 9 9v9a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" },
  { href: "/dashboard/workflow", label: "Workflow", icon: "M5 6a3 3 0 116 0 3 3 0 01-6 0zm0 12a3 3 0 116 0 3 3 0 01-6 0zm14-6a3 3 0 11-6 0 3 3 0 016 0zM8 9v6m3-9h2a3 3 0 013 3m-6 6h2a3 3 0 003-3", badge: "novo" },
  { href: "/dashboard/disparos", label: "Disparos", icon: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
  { href: "/dashboard/conversas", label: "Conversas", icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
  { href: "/dashboard/automacao", label: "Automação", icon: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" },
  { href: "/dashboard/contatos", label: "Contatos", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 00-2-1.2L14.5 3h-5l-.4 2.5a7.5 7.5 0 00-2 1.2l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 002 1.2l.4 2.5h5l.4-2.5a7.5 7.5 0 002-1.2l2.4.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2z" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-bg/50 backdrop-blur-sm h-screen sticky top-0 flex flex-col">
      <div className="px-6 h-16 flex items-center border-b border-white/[0.06]">
        <Link href="/dashboard"><Logo /></Link>
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {nav.map((item) => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-[0_0_22px_-8px_rgba(0,255,136,0.6)]"
                  : "text-ink-300 hover:text-ink-100 hover:bg-white/5 border border-transparent"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary shadow-[0_0_10px_rgba(0,255,136,0.8)]" />
              )}
              <svg className="size-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-accent-purple/25 text-accent-purple border border-accent-purple/40">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/[0.06]">
        <Link href="/dashboard/configuracoes" className="card p-3 flex items-center gap-3 hover:border-primary/30 transition-all">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-sm">⚡</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Plano</div>
            <div className="text-xs text-ink-500">Ver detalhes</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
