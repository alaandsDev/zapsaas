import Link from "next/link";
import Logo from "./Logo";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent pointer-events-none" />
      <div className="container-x relative pt-16 pb-10">
        {/* Top: brand + links */}
        <div className="grid md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 text-sm text-ink-300 max-w-sm leading-relaxed">
              O sistema operacional de comunicação no WhatsApp: CRM conversacional, automação e IA.
            </p>

            {/* Status pill */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-semibold">Todos os sistemas operando</span>
            </div>
          </div>

          {/* Soluções */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-4">Soluções</div>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link href="/oticas" className="hover:text-ink-100 transition-colors">Para Óticas</Link></li>
              <li><Link href="/clinicas" className="hover:text-ink-100 transition-colors">Para Clínicas</Link></li>
              <li><Link href="/delivery" className="hover:text-ink-100 transition-colors">Para Delivery</Link></li>
              <li><Link href="/imobiliarias" className="hover:text-ink-100 transition-colors">Para Imobiliárias</Link></li>
            </ul>
          </div>

          {/* Produto */}
          <div className="md:col-span-2">
            <div className="text-sm font-semibold mb-4">Produto</div>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li><Link href="/#planos" className="hover:text-ink-100 transition-colors">Planos</Link></li>
              <li><Link href="/#faq" className="hover:text-ink-100 transition-colors">Perguntas</Link></li>
              <li><Link href="/blog" className="hover:text-ink-100 transition-colors">Blog</Link></li>
              <li><Link href="/register" className="hover:text-ink-100 transition-colors">Começar grátis</Link></li>
              <li><Link href="/login" className="hover:text-ink-100 transition-colors">Entrar</Link></li>
              <li><Link href="/changelog" className="hover:text-ink-100 transition-colors">Novidades</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <div className="text-sm font-semibold mb-2">Receba dicas que vendem</div>
            <p className="text-xs text-ink-400 mb-4">
              1 e-mail por semana com táticas reais de automação e revenue ops no WhatsApp. Zero spam.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-ink-500">
          <div>© {new Date().getFullYear()} Wayvo. Todos os direitos reservados.</div>
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <svg className="size-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z"/></svg>
              Pagamento seguro Stripe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="size-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              LGPD compliant
            </span>
            <span>Feito 🇧🇷 com café e código</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
