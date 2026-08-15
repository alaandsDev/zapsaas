"use client";
import Reveal from "./ui/Reveal";

export default function HowItWorks({ steps, title = "Funciona em 3 passos" }) {
  return (
    <section id="como-funciona" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <Reveal className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Como funciona</div>
          <h2 className="text-h2">{title}</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Sem programador, sem instalação. Em minutos seu negócio começa a vender no automático.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <Reveal key={i} delay={Math.min(i * 100, 200)} className="card p-7 relative overflow-hidden group">
              {s.img && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <img src={s.img} alt="" className="w-full h-full object-cover opacity-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/60" />
                </div>
              )}
              {s.img && (
                <div className="relative mb-4 rounded-xl overflow-hidden h-36">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.parentElement.style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 size-8 rounded-lg bg-primary text-bg text-sm font-bold flex items-center justify-center shadow-glow">
                    {i + 1}
                  </div>
                </div>
              )}
              {!s.img && (
                <div className="size-9 rounded-xl bg-primary text-bg font-bold flex items-center justify-center mb-5 shadow-glow">
                  {i + 1}
                </div>
              )}
              <h3 className="text-h3 relative">{s.title}</h3>
              <p className="text-ink-300 mt-2 leading-relaxed relative">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
