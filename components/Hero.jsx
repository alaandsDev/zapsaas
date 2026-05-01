export default function Hero({
  eyebrow = "Sistema de Vendas Automáticas 24h",
  title,
  highlight,
  subtitle,
  primaryCTA = { label: "Começar agora", href: "/register" },
  secondaryCTA = { label: "Ver como funciona", href: "#como-funciona" },
  metrics,
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="container-x relative pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-3xl">
          <div className="eyebrow mb-6">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {eyebrow}
          </div>
          <h1 className="text-h1 leading-[1.05] tracking-tight">
            {title}{" "}
            {highlight && <span className="gradient-text">{highlight}</span>}
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-ink-300 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={primaryCTA.href} className="btn-primary text-base">
              {primaryCTA.label} →
            </a>
            <a href={secondaryCTA.href} className="btn-ghost text-base">
              {secondaryCTA.label}
            </a>
          </div>
          <p className="mt-5 text-sm text-ink-500">
            Plano Starter grátis · Sem cartão · Configure em 5 minutos
          </p>
        </div>

        {metrics && (
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <div key={i} className="card p-5">
                <div className="text-2xl font-bold text-ink-100">{m.value}</div>
                <div className="text-sm text-ink-300 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
