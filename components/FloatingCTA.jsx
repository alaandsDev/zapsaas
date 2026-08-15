"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./ui/Icon";

const STORAGE_KEY = "zapflow_floating_cta_dismissed";
// Páginas públicas onde o CTA aparece. Esconde em dashboard/admin/login/register.
const HIDE_PREFIXES = ["/dashboard", "/admin", "/login", "/register"];

export default function FloatingCTA() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);

    const onScroll = () => {
      // Aparece após scroll de ~600px (passou da hero)
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] sm:max-w-sm animate-toast-in">
      <div className="card p-4 pr-3 shadow-2xl shadow-primary/20 bg-bg2/95 backdrop-blur-md border-primary/25 flex items-center gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center text-bg">
          <Icon name="instantaneo" className="size-5" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">Comece grátis em 5 minutos</div>
          <div className="text-xs text-ink-400 mt-0.5">Sem cartão · Cancele quando quiser</div>
        </div>
        <Link
          href="/register"
          className="shrink-0 px-4 py-2 rounded-lg bg-primary text-bg font-semibold text-xs hover:opacity-90 whitespace-nowrap"
        >
          Começar
        </Link>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 size-7 rounded-md text-ink-500 hover:text-ink-100 hover:bg-white/5 flex items-center justify-center text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
