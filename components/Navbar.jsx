"use client";
import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

const links = [
  { href: "/oticas", label: "Óticas" },
  { href: "/clinicas", label: "Clínicas" },
  { href: "/delivery", label: "Delivery" },
  { href: "/imobiliarias", label: "Imobiliárias" },
];

// Só no menu mobile: no desktop já existem como âncora na própria página.
const mobileExtras = [
  { href: "/#planos", label: "Planos" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/70 border-b border-white/[0.06]">
      <div className="container-x flex items-center justify-between h-16">
        <Link href="/" aria-label="Wayvo" onClick={() => setOpen(false)}><Logo /></Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-ink-300 hover:text-ink-100 transition-colors rounded-lg hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden sm:inline-flex text-sm text-ink-300 hover:text-ink-100 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            Entrar
          </a>
          <a href="/register" className="btn-primary !py-2.5 !px-5 text-sm">
            Testar grátis →
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="md:hidden size-10 -mr-1 flex items-center justify-center rounded-xl border border-white/10 text-ink-200 hover:border-white/20 transition-colors"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>
              ) : (
                <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-mobile"
          className="md:hidden border-t border-white/[0.06] bg-bg/95 backdrop-blur-md"
        >
          <div className="container-x py-3 flex flex-col">
            {[...links, ...mobileExtras].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-ink-200 hover:text-ink-100 border-b border-white/[0.05] transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-semibold text-primary"
            >
              Entrar na minha conta →
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
