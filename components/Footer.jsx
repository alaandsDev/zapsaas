import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-14 mt-8">
      <div className="container-x">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-ink-300 max-w-sm leading-relaxed">
              Sistema de Vendas Automáticas 24h pelo WhatsApp.
              Para negócios que querem vender todos os dias no automático.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">Soluções</div>
            <ul className="space-y-2 text-sm text-ink-300">
              <li><Link href="/oticas" className="hover:text-ink-100">Para Óticas</Link></li>
              <li><Link href="/clinicas" className="hover:text-ink-100">Para Clínicas</Link></li>
              <li><Link href="/delivery" className="hover:text-ink-100">Para Delivery</Link></li>
              <li><Link href="/imobiliarias" className="hover:text-ink-100">Para Imobiliárias</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">ZapFlow</div>
            <ul className="space-y-2 text-sm text-ink-300">
              <li><a href="/app?tab=register" className="hover:text-ink-100">Começar grátis</a></li>
              <li><a href="/app?tab=login" className="hover:text-ink-100">Entrar</a></li>
              <li><Link href="/#planos" className="hover:text-ink-100">Planos</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-ink-500">
          <div>© {new Date().getFullYear()} ZapFlow. Todos os direitos reservados.</div>
          <div>Pagamento seguro via Stripe</div>
        </div>
      </div>
    </footer>
  );
}
