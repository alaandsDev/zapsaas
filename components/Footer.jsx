import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import Logo from "./Logo";

const linkClass = "text-[#4B5565] hover:text-[#0E8A47] transition-colors";

export default function Footer() {
  return (
    <footer className="bg-[#EDEFF3] border-t border-[#E4E7EC]">
      <div className="container-x pt-16 pb-10">
        <div className="grid md:grid-cols-12 gap-10">
          {/* Marca */}
          <div className="md:col-span-4 text-[#0A1020]">
            <Logo />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-[#4B5565]">
              O sistema operacional de comunicação no WhatsApp: CRM conversacional, automação e IA.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAFBF1] border border-[#D2F0E0] text-[12px]">
              <span className="size-1.5 rounded-full bg-[#0E8A47] animate-pulse" />
              <span className="text-[#0E8A47] font-semibold">Todos os sistemas operando</span>
            </div>
          </div>

          {/* Soluções */}
          <div className="md:col-span-2">
            <div className="text-[14px] font-semibold text-[#0A1020] mb-4">Soluções</div>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link href="/oticas" className={linkClass}>Para Óticas</Link></li>
              <li><Link href="/clinicas" className={linkClass}>Para Clínicas</Link></li>
              <li><Link href="/delivery" className={linkClass}>Para Delivery</Link></li>
              <li><Link href="/imobiliarias" className={linkClass}>Para Imobiliárias</Link></li>
            </ul>
          </div>

          {/* Produto */}
          <div className="md:col-span-2">
            <div className="text-[14px] font-semibold text-[#0A1020] mb-4">Produto</div>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link href="/#planos" className={linkClass}>Planos</Link></li>
              <li><Link href="/#faq" className={linkClass}>Perguntas</Link></li>
              <li><Link href="/blog" className={linkClass}>Blog</Link></li>
              <li><Link href="/register" className={linkClass}>Testar 7 dias</Link></li>
              <li><Link href="/login" className={linkClass}>Entrar</Link></li>
              <li><Link href="/changelog" className={linkClass}>Novidades</Link></li>
            </ul>
          </div>

          {/* Contato + legal */}
          <div className="md:col-span-4">
            <div className="text-[14px] font-semibold text-[#0A1020] mb-4">Fale com a gente</div>
            <ul className="space-y-2.5 text-[14px] text-[#4B5565]">
              <li>
                Suporte:{" "}
                <a href="mailto:suporte@wayvo.app.br" className="text-[#0E8A47] hover:text-[#0B7239] hover:underline">
                  suporte@wayvo.app.br
                </a>
              </li>
              <li>
                Privacidade e LGPD:{" "}
                <a href="mailto:privacidade@wayvo.app.br" className="text-[#0E8A47] hover:text-[#0B7239] hover:underline">
                  privacidade@wayvo.app.br
                </a>
              </li>
              <li>
                Jurídico:{" "}
                <a href="mailto:legal@wayvo.app.br" className="text-[#0E8A47] hover:text-[#0B7239] hover:underline">
                  legal@wayvo.app.br
                </a>
              </li>
            </ul>

            <div className="text-[14px] font-semibold text-[#0A1020] mt-7 mb-4">Legal</div>
            <ul className="space-y-2.5 text-[14px]">
              <li><Link href="/privacidade" className={linkClass}>Política de Privacidade</Link></li>
              <li><Link href="/termos" className={linkClass}>Termos de Uso</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4 text-[12.5px] text-[#8A94A6]">
          <div>© {new Date().getFullYear()} Wayvo. Todos os direitos reservados.</div>
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-[#0E8A47]" strokeWidth={2.5} />
              Pagamento seguro Stripe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-[#0E8A47]" strokeWidth={2.5} />
              LGPD compliant
            </span>
            <span>Feito 🇧🇷 com café e código</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
