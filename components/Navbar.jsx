"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

// Âncoras da própria landing — o header é o índice da página.
const links = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
  { href: "/#nichos", label: "Para seu nicho" },
  { href: "/#faq", label: "Dúvidas" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b border-[#E4E7EC]"
      style={{ background: "rgba(245,246,248,0.82)" }}
    >
      <div className="container-x flex items-center justify-between h-[68px]">
        <Link href="/" aria-label="Wayvo" onClick={() => setOpen(false)} className="text-[#0A1020]">
          <Logo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-[10px] text-[14px] font-semibold text-[#0E8A47] hover:bg-[#EAF7F0] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden lg:inline-flex text-[14px] font-medium text-[#4B5565] hover:text-[#0A1020] px-3 py-2 transition-colors"
          >
            Entrar
          </a>
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white bg-[#0E8A47] hover:bg-[#0B7239] hover:-translate-y-px transition-all duration-150"
            style={{ boxShadow: "0 6px 18px rgba(14,138,71,0.28)" }}
          >
            Testar 7 dias →
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="lg:hidden size-10 -mr-1 flex items-center justify-center rounded-xl border border-[#E4E7EC] bg-white text-[#3A4553] hover:border-[#D2F0E0] transition-colors"
          >
            {open ? <X className="size-5" strokeWidth={2.25} /> : <Menu className="size-5" strokeWidth={2.25} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" className="lg:hidden border-t border-[#E4E7EC] bg-[#F5F6F8]">
          <div className="container-x py-3 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-[14.5px] font-semibold text-[#0A1020] border-b border-[#EDEFF3] transition-colors hover:text-[#0E8A47]"
              >
                {l.label}
              </Link>
            ))}
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="py-3.5 text-[14.5px] font-semibold text-[#0E8A47]"
            >
              Entrar na minha conta →
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
