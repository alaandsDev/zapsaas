"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { getUser, clearAuth } from "../../lib/api";
import NotificationsBell from "./NotificationsBell";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ title, subtitle, actions }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  function logout() { clearAuth(); router.push("/login"); }

  const initial = (user?.name || user?.email || "?")[0]?.toUpperCase();

  return (
    <header className="min-h-[60px] border-b border-ink-700/60 bg-bg/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold truncate leading-tight">{title}</h1>
        {subtitle && <p className="text-[11px] text-ink-500 truncate mt-0.5">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 overflow-x-auto">{actions}</div>
      )}

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationsBell />

        {/* User menu */}
        <div className="relative ml-1">
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.04] transition-colors">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-accent-blue text-bg font-black flex items-center justify-center text-sm shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-semibold truncate max-w-[100px]">{user?.name?.split(" ")[0] || "Conta"}</p>
            </div>
            <ChevronDown className={`size-3.5 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-12 w-56 card p-2 z-40 shadow-elevated animate-scale-in border-ink-600">
                <div className="px-3 py-2.5 border-b border-ink-700/60 mb-1">
                  <p className="text-sm font-semibold truncate">{user?.name || "Conta"}</p>
                  <p className="text-[11px] text-ink-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <a href="/dashboard/minha-conta"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-300 hover:text-ink-100 hover:bg-white/[0.04] transition-colors">
                  <Settings className="size-4" />
                  Minha Conta
                </a>
                <button onClick={logout}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors mt-0.5">
                  <LogOut className="size-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
