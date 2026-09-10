import Link from "next/link";
import { Glasses, CalendarCheck, UtensilsCrossed, House, ArrowRight } from "lucide-react";
import Reveal from "./ui/Reveal";

const NICHES = [
  {
    icon: Glasses,
    title: "Óticas",
    desc: "Reativação de base, segundo par e troca de lentes no automático.",
    href: "/oticas",
  },
  {
    icon: CalendarCheck,
    title: "Clínicas",
    desc: "Agendamento, confirmação e retorno sem ninguém digitando.",
    href: "/clinicas",
  },
  {
    icon: UtensilsCrossed,
    title: "Delivery",
    desc: "Promoções, recorrência e recuperação de pedido abandonado.",
    href: "/delivery",
  },
  {
    icon: House,
    title: "Imobiliárias",
    desc: "Nutrição de leads, agendamento de visita e follow-up longo.",
    href: "/imobiliarias",
  },
];

export default function Niches() {
  return (
    <section id="nichos" className="bg-[#ECEEF2] border-y border-[#E4E7EC] py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl mx-auto text-center mb-12">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            Para seu nicho
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            Templates prontos pro seu tipo de negócio
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NICHES.map((n, i) => (
            <Reveal key={n.href} delay={Math.min(i * 70, 210)} className="h-full">
              <Link
                href={n.href}
                className="group flex h-full flex-col rounded-[18px] bg-white border border-[#E9ECF1] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#D2F0E0] shadow-[0_4px_14px_-8px_rgba(10,16,32,0.14)] hover:shadow-[0_16px_34px_-16px_rgba(10,16,32,0.22)]"
              >
                <div className="size-[42px] rounded-xl bg-[#EAFBF1] border border-[#D2F0E0] flex items-center justify-center text-[#0E8A47] mb-4">
                  <n.icon className="size-[21px]" strokeWidth={2} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#0A1020]">{n.title}</h3>
                <p className="text-[14.5px] text-[#5A6474] mt-2 leading-relaxed flex-1">{n.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0E8A47]">
                  Ver templates
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
