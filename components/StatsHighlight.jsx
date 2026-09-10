import { TrendingUp } from "lucide-react";
import Reveal from "./ui/Reveal";

const STATS = [
  { value: "+37", label: "vendas em 7 dias na média dos clientes" },
  { value: "3x", label: "mais faturamento no primeiro mês" },
  { value: "98%", label: "de taxa de entrega das mensagens" },
  { value: "5 min", label: "para colocar a operação no ar" },
];

const GRADIENT_TEXT = {
  backgroundImage: "linear-gradient(100deg,#0E8A47 0%,#25D366 40%,#2F80ED 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export default function StatsHighlight() {
  return (
    <section className="relative overflow-hidden bg-[#F5F6F8] py-24">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 size-[520px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(14,138,71,0.16), transparent 68%)", filter: "blur(30px)" }}
      />
      <div className="container-x relative text-center">
        <Reveal className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-6">
          <TrendingUp className="size-3.5" strokeWidth={2.5} />
          Resultados comprovados
        </Reveal>

        <Reveal delay={80} className="max-w-3xl mx-auto">
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold leading-[1.08] tracking-[-0.025em] text-[#0A1020]">
            Mais de <span style={GRADIENT_TEXT}>200 negócios</span>
            <br />
            já vendem mais com o Wayvo
          </h2>
        </Reveal>

        <Reveal delay={140} className="mt-5 text-[17px] text-[#4B5565] max-w-xl mx-auto leading-relaxed">
          Veja o impacto real na operação de quem já colocou o Wayvo pra trabalhar.
        </Reveal>

        <Reveal delay={200} className="mt-14 mx-auto max-w-4xl">
          <div className="rounded-[22px] bg-white border border-[#E9ECF1] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#EDEFF3] overflow-hidden shadow-[0_18px_44px_-28px_rgba(10,16,32,0.28)]">
            {STATS.map((s, i) => (
              <div key={i} className="p-6 sm:p-8">
                <div className="text-[32px] sm:text-[38px] font-bold leading-none" style={GRADIENT_TEXT}>
                  {s.value}
                </div>
                <div className="text-[13.5px] text-[#5A6474] mt-2.5 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
