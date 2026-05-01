export default function Features({ title, items }) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Recursos</div>
          <h2 className="text-h2">{title}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((f, i) => (
            <div key={i} className="card p-7 hover:border-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-ink-300 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
