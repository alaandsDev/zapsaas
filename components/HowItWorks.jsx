"use client";
import Reveal from "./ui/Reveal";

export default function HowItWorks({ steps, title = "Funciona em 3 passos" }) {
  return (
    <section id="como-funciona" className="py-24">
      <div className="container-x">
        <Reveal className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Como funciona</div>
          <h2 className="text-h2">{title}</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Sem programador, sem instalação. Em minutos seu negócio começa a vender no automático.
          </p>
        </Reveal>

        {/* Um bloco só — os 3 passos vivem dentro do mesmo card, separados por
            divisórias internas, em vez de 3 cards soltos (que no mobile
            empilhavam com um respiro entre eles e pareciam desconexos). */}
        <Reveal delay={100} className="relative rounded-3xl border border-white/10 overflow-hidden bg-gradient-to-br from-card via-card to-bg shadow-elevated">
          <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
            {steps.map((s, i) => (
              <div key={i} className="p-7 sm:p-8 relative">
                {s.img && (
                  <div className="relative mb-5 rounded-xl overflow-hidden h-32 sm:h-36">
                    <img
                      src={s.img}
                      alt={s.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                )}
                <div className="size-9 rounded-xl bg-primary text-bg font-bold flex items-center justify-center mb-4 shadow-glow">
                  {i + 1}
                </div>
                <h3 className="text-h3">{s.title}</h3>
                <p className="text-ink-300 mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
