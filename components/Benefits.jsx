import Reveal from "./ui/Reveal";
import Icon from "./ui/Icon";

export default function Benefits({ title, subtitle, items }) {
  return (
    <section className="section-light py-24">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mb-14">
          <div className="eyebrow-light mb-4">Por que Wayvo</div>
          <h2 className="text-h2 text-graphite-100">{title}</h2>
          {subtitle && <p className="mt-4 text-graphite-100/60 text-lg">{subtitle}</p>}
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((b, i) => (
            <Reveal key={i} delay={Math.min(i * 70, 210)}>
              <div className="card-light-hover p-6 h-full">
                <div className="size-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary-dark mb-4">
                  <Icon name={b.icon} className="size-5" />
                </div>
                <h3 className="font-semibold text-graphite-100">{b.title}</h3>
                <p className="text-sm text-graphite-100/60 mt-2 leading-relaxed">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
