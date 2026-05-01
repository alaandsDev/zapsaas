export default function SocialProof({ stats, testimonials }) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="grid lg:grid-cols-3 gap-4 mb-14">
          {stats.map((s, i) => (
            <div
              key={i}
              className="card p-8 text-center bg-gradient-to-b from-card to-card/40"
            >
              <div className="text-5xl font-bold gradient-text">{s.value}</div>
              <div className="text-ink-300 mt-3">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <figure key={i} className="card p-6">
              <div className="flex gap-1 text-primary mb-4">{"★★★★★"}</div>
              <blockquote className="text-ink-100 leading-relaxed">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div
                  className="size-10 rounded-full flex items-center justify-center font-semibold text-bg"
                  style={{ background: t.color || "#00FFB2" }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-ink-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
