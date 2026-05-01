const plans = [
  {
    name: "Starter",
    price: "Grátis",
    period: "para sempre",
    desc: "Pra testar e ativar suas primeiras vendas no automático.",
    cta: "Começar grátis",
    features: [
      "Até 3 disparos personalizados",
      "Sistema de vendas 24h ativo",
      "Templates prontos por nicho",
      "Painel completo de controle",
      "Suporte por e-mail",
    ],
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 47",
    period: "/mês",
    desc: "Para quem quer escalar e vender todos os dias no automático.",
    cta: "Assinar Pro agora",
    features: [
      "Disparos ilimitados",
      "Sistema de vendas 24h ativo",
      "Setup incluso e templates premium",
      "Listas de contatos ilimitadas",
      "Histórico completo e relatórios",
      "Suporte prioritário no WhatsApp",
    ],
    href: "/register",
    highlighted: true,
    badge: "Mais escolhido",
  },
];

export default function Pricing() {
  return (
    <section id="planos" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="eyebrow mb-4 mx-auto">Planos</div>
          <h2 className="text-h2">Escolha o plano que cabe no seu momento</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Comece grátis hoje. Suba para o Pro quando quiser escalar.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative card p-8 ${
                p.highlighted
                  ? "border-primary/40 bg-gradient-to-b from-primary/[0.04] to-card shadow-glow"
                  : ""
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-8 bg-primary text-bg text-xs font-bold px-3 py-1 rounded-full">
                  {p.badge}
                </div>
              )}
              <div className="text-sm text-ink-300 font-medium">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{p.price}</span>
                <span className="text-ink-500">{p.period}</span>
              </div>
              <p className="mt-3 text-ink-300">{p.desc}</p>
              <a
                href={p.href}
                className={p.highlighted ? "btn-primary w-full mt-6" : "btn-ghost w-full mt-6"}
              >
                {p.cta}
              </a>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-ink-100">
                    <svg
                      className="size-5 text-primary shrink-0 mt-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-ink-500 mt-8">
          Pagamento seguro via Stripe · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
