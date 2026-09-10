import {
  MessageSquareOff, Table2, BellOff, Repeat, TrendingDown,
  Zap, Send, Moon, Bot, Target, X, Check,
} from "lucide-react";
import Reveal from "./ui/Reveal";

const BEFORE = [
  { icon: MessageSquareOff, text: "Cliente manda mensagem e fica horas sem resposta" },
  { icon: Table2, text: "Lista de contatos parada na planilha — dinheiro morto" },
  { icon: BellOff, text: "Fim de semana e feriado: WhatsApp em silêncio total" },
  { icon: Repeat, text: "Você respondendo a mesma pergunta 50 vezes por dia" },
  { icon: TrendingDown, text: "Vendas perdidas porque ninguém deu follow-up" },
];

const AFTER = [
  { icon: Zap, text: "Resposta automática personalizada em 1 segundo" },
  { icon: Send, text: "Reativa toda a base com 1 clique — vendas chegando" },
  { icon: Moon, text: "Vende dormindo, almoçando, no churrasco do domingo" },
  { icon: Bot, text: "Bot atende 80% das dúvidas, você fecha as vendas" },
  { icon: Target, text: "Cada lead recebe a mensagem certa no momento certo" },
];

export default function BeforeAfter() {
  return (
    <section className="bg-[#F5F6F8] py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl mx-auto text-center mb-14">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            Antes vs depois
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            A diferença é gritante.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4B5565]">
            O que muda quando a operação roda com CRM conversacional, automação e IA.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* ANTES */}
          <Reveal className="rounded-[20px] bg-[#FCFCFD] border border-[#EDEFF3] p-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FBD7D7] text-[#C2434A] text-[11.5px] font-bold tracking-wide mb-5">
              <X className="size-3.5" strokeWidth={3} />
              ANTES DO WAYVO
            </div>
            <h3 className="text-[20px] font-bold text-[#0A1020] mb-5">Você refém do WhatsApp</h3>
            <ul className="space-y-3.5">
              {BEFORE.map((b, i) => (
                <li key={i} className="flex items-center gap-3.5">
                  <span className="size-9 shrink-0 rounded-lg bg-[#FEF2F2] border border-[#FBD7D7] flex items-center justify-center text-[#C2434A]">
                    <b.icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <span className="text-[14.5px] text-[#5A6474] leading-snug">{b.text}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* DEPOIS */}
          <Reveal
            delay={100}
            className="relative overflow-hidden rounded-[20px] border border-[#D4EFE0] p-7 shadow-[0_18px_40px_-24px_rgba(14,138,71,0.45)]"
          >
            <div
              className="absolute inset-0 rounded-[20px] pointer-events-none"
              style={{ background: "linear-gradient(160deg,#F2FBF6 0%,#FFFFFF 70%)" }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF1] border border-[#D2F0E0] text-[#0E8A47] text-[11.5px] font-bold tracking-wide mb-5">
                <Check className="size-3.5" strokeWidth={3} />
                COM O WAYVO
              </div>
              <h3 className="text-[20px] font-bold text-[#0A1020] mb-5">WhatsApp trabalhando por você</h3>
              <ul className="space-y-3.5">
                {AFTER.map((a, i) => (
                  <li key={i} className="flex items-center gap-3.5">
                    <span className="size-9 shrink-0 rounded-lg bg-[#EAFBF1] border border-[#D2F0E0] flex items-center justify-center text-[#0E8A47]">
                      <a.icon className="size-[18px]" strokeWidth={2} />
                    </span>
                    <span className="text-[14.5px] text-[#0A1020] font-medium leading-snug">{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white bg-[#0E8A47] hover:bg-[#0B7239] hover:-translate-y-px active:scale-[.98] transition-all duration-150 shadow-[0_10px_26px_rgba(14,138,71,0.28)]"
          >
            Quero parar de perder vendas →
          </a>
          <p className="mt-3.5 text-[13px] text-[#8A94A6]">
            Configure em 5 minutos · 7 dias de teste grátis
          </p>
        </div>
      </div>
    </section>
  );
}
