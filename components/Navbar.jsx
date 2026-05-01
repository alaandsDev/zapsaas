import Link from "next/link";
import Logo from "./Logo";

const links = [
  { href: "/oticas", label: "Óticas" },
  { href: "/clinicas", label: "Clínicas" },
  { href: "/delivery", label: "Delivery" },
  { href: "/imobiliarias", label: "Imobiliárias" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/70 border-b border-white/[0.06]">
      <div className="container-x flex items-center justify-between h-16">
        <Link href="/" aria-label="ZapFlow"><Logo /></Link>
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
            Começar grátis →
          </a>
        </div>
      </div>
    </header>
  );
}
