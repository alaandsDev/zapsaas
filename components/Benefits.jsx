export default function Benefits({ title, subtitle, items }) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Por que ZapFlow</div>
          <h2 className="text-h2">{title}</h2>
          {subtitle && <p className="mt-4 text-ink-300 text-lg">{subtitle}</p>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((b, i) => (
            <div
              key={i}
              className="card p-6 hover:border-white/15 hover:bg-card/80 transition-all"
            >
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg mb-4">
                {b.icon}
              </div>
              <h3 className="font-semibold text-ink-100">{b.title}</h3>
              <p className="text-sm text-ink-300 mt-2 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
