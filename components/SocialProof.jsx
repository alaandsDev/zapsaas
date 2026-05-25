export default function SocialProof({ stats, testimonials }) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        {/* Stats premium */}
        <div className="grid lg:grid-cols-3 gap-4 mb-16">
          {stats.map((s, i) => (
            <div
              key={i}
              className="glass p-8 text-center bg-gradient-to-b from-card to-card/40 relative overflow-hidden"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 size-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="text-5xl font-bold gradient-text">{s.value}</div>
                <div className="text-ink-300 mt-3">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            O que os clientes dizem
          </div>
          <h2 className="text-h2">Histórias reais de quem<br />vende mais com o Wayvo</h2>
        </div>

        {/* Testimonials com métrica concreta */}
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="glass p-6 relative hover:border-primary/30 transition-colors group"
            >
              {/* Resultado destacado em badge no topo */}
              {t.result && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold mb-4">
                  <span>📈</span>
                  <span>{t.result}</span>
                </div>
              )}

              <div className="flex gap-1 text-primary mb-4 text-sm">★★★★★</div>

              <blockquote className="text-ink-100 leading-relaxed text-[15px]">
                "{t.quote}"
              </blockquote>

              <figcaption className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-3">
                <div className="size-11 rounded-full overflow-hidden shrink-0 shadow-lg ring-2 ring-white/10">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-bg" style={{ background: t.color || "#00FFB2" }}>
                      {t.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-ink-400">{t.role}</div>
                </div>
                {/* Selo "Cliente verificado" */}
                <div className="ml-auto" title="Cliente verificado">
                  <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3zm-1 14l-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/>
                  </svg>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
