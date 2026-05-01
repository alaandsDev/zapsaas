export default function HowItWorks({ steps, title = "Funciona em 3 passos" }) {
  return (
    <section id="como-funciona" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Como funciona</div>
          <h2 className="text-h2">{title}</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Sem programador, sem instalação. Em minutos seu negócio começa a vender no automático.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <div key={i} className="card p-7 relative">
              <div className="size-9 rounded-xl bg-primary text-bg font-bold flex items-center justify-center mb-5 shadow-glow">
                {i + 1}
              </div>
              <h3 className="text-h3">{s.title}</h3>
              <p className="text-ink-300 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
