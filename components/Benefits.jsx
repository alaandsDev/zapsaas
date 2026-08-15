import Reveal from "./ui/Reveal";
import Icon from "./ui/Icon";

export default function Benefits({ title, subtitle, items }) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <Reveal className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Por que Wayvo</div>
          <h2 className="text-h2">{title}</h2>
          {subtitle && <p className="mt-4 text-ink-300 text-lg">{subtitle}</p>}
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((b, i) => (
            <Reveal key={i} delay={Math.min(i * 70, 210)}>
              <div className="card p-6 h-full hover:border-white/15 hover:bg-card/80 transition-all">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                  <Icon name={b.icon} className="size-5" />
                </div>
                <h3 className="font-semibold text-ink-100">{b.title}</h3>
                <p className="text-sm text-ink-300 mt-2 leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
