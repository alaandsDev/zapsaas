"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { getUser, clearAuth } from "../../lib/api";
import NotificationsBell from "./NotificationsBell";

export default function Topbar({ title, subtitle, actions }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  function logout() { clearAuth(); router.push("/login"); }

  const initial = (user?.name || user?.email || "?")[0]?.toUpperCase();

  return (
    <header className="min-h-[60px] border-b border-dash-border bg-white/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 sm:px-6 gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold truncate leading-tight text-dash-ink">{title}</h1>
        {subtitle && <p className="text-[11px] text-dash-faint truncate mt-0.5">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">{actions}</div>
      )}

      <div className="flex items-center gap-1">
        <NotificationsBell />

        {/* User menu */}
        <div className="relative ml-1">
          <button onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-black/[0.03] transition-colors">
            <div className="size-8 rounded-lg bg-gradient-to-br from-dash-green to-dash-blue text-white font-black flex items-center justify-center text-sm shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-semibold truncate max-w-[100px] text-dash-ink2">{user?.name?.split(" ")[0] || "Conta"}</p>
            </div>
            <ChevronDown className={`size-3.5 text-dash-faint transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-12 w-56 dash-card p-2 z-40 shadow-elevated animate-scale-in">
                <div className="px-3 py-2.5 border-b border-dash-border mb-1">
                  <p className="text-sm font-semibold truncate text-dash-ink">{user?.name || "Conta"}</p>
                  <p className="text-[11px] text-dash-faint truncate mt-0.5">{user?.email}</p>
                </div>
                <a href="/dashboard/workspace"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-dash-muted hover:text-dash-ink hover:bg-black/[0.03] transition-colors">
                  <Settings className="size-4" />
                  Minha Conta
                </a>
                <button onClick={logout}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm text-dash-red hover:bg-dash-red/10 transition-colors mt-0.5">
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
