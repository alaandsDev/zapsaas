"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuth } from "../../lib/api";

export default function Topbar({ title, subtitle, actions }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function logout() {
    clearAuth();
    router.push("/login");
  }

  const initial = (user?.name || user?.email || "?")[0]?.toUpperCase();

  return (
    <header className="h-16 border-b border-white/[0.06] bg-bg/70 backdrop-blur-md sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-500 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="size-9 rounded-full bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center text-sm hover:scale-105 transition-transform"
        >
          {initial}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 w-56 card p-2 z-40">
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                <div className="text-sm font-medium truncate">{user?.name || "Conta"}</div>
                <div className="text-xs text-ink-500 truncate">{user?.email}</div>
              </div>
              <a href="/dashboard/configuracoes" className="block px-3 py-2 rounded-lg text-sm text-ink-300 hover:text-ink-100 hover:bg-white/5">Configurações</a>
              <button onClick={logout} className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10">Sair</button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
