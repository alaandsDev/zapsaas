import Reveal from "./ui/Reveal";
import Icon from "./ui/Icon";

const STATS = [
  { value: "+37", label: "vendas em 7 dias na média dos clientes" },
  { value: "3x", label: "mais faturamento no primeiro mês" },
  { value: "98%", label: "de taxa de entrega das mensagens" },
  { value: "5 min", label: "para colocar a operação no ar" },
];

export default function StatsHighlight() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="container-x relative text-center">
        <Reveal className="eyebrow justify-center mb-6">
          <Icon name="revenue" className="size-3.5" strokeWidth={2.25} />
          Resultados comprovados
        </Reveal>
        <Reveal delay={80} className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
            Mais de <span className="gradient-text">200 negócios</span><br />
            já vendem mais com o Wayvo
          </h2>
        </Reveal>
        <Reveal delay={140} className="mt-5 text-ink-300 text-lg max-w-xl mx-auto">
          Veja o impacto real na operação de quem já colocou o Wayvo pra trabalhar.
        </Reveal>

        <Reveal delay={200} className="mt-14 mx-auto max-w-4xl">
          <div className="glass grid grid-cols-2 lg:grid-cols-4 divide-y divide-white/[0.06] lg:divide-y-0 lg:divide-x">
            {STATS.map((s, i) => (
              <div key={i} className="p-6 sm:p-8">
                <div className="text-3xl sm:text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-ink-400 mt-2 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
