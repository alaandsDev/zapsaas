const plans = [
  {
    name: "Starter",
    tagline: "Pra testar",
    price: "Grátis",
    period: "para sempre",
    desc: "Comece sem cartão de crédito e ative suas primeiras vendas hoje.",
    cta: "Começar grátis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    tagline: "Pra escalar",
    price: "R$ 47",
    period: "/mês",
    desc: "Disparos ilimitados, 2 chips com round-robin anti-ban e CRM completo.",
    cta: "Assinar Pro agora",
    href: "/register",
    highlighted: true,
    badge: "Mais escolhido",
    socialProof: "Junte-se a 200+ negócios",
  },
];

const FEATURES = [
  { label: "Disparos por mês", free: "3", pro: "Ilimitados" },
  { label: "Conexões WhatsApp", free: "1 número", pro: "2 números (round-robin anti-ban)" },
  { label: "Leads / contatos", free: "Até 50", pro: "Ilimitados" },
  { label: "Listas de contatos", free: "1 lista", pro: "Ilimitadas" },
  { label: "Mídia (foto/vídeo/áudio/PDF)", free: true, pro: true },
  { label: "Templates prontos por nicho", free: true, pro: true },
  { label: "Painel completo de controle", free: true, pro: true },
  { label: "Relatórios em tempo real", free: false, pro: true },
  { label: "Histórico completo de campanhas", free: false, pro: true },
  { label: "Export de relatórios em Excel", free: false, pro: true },
  { label: "Automação inteligente (fluxos)", free: false, pro: true },
  { label: "API oficial WhatsApp Cloud", free: false, pro: true },
  { label: "Suporte prioritário no WhatsApp", free: false, pro: true },
];

export default function Pricing() {
  return (
    <section id="planos" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Planos transparentes
          </div>
          <h2 className="text-h2">Comece grátis. Escale<br />quando quiser.</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Sem letra miúda. Cancele com 1 clique.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative card p-8 ${
                p.highlighted
                  ? "border-primary/40 bg-gradient-to-b from-primary/[0.06] to-card shadow-glow scale-[1.02]"
                  : ""
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-bg text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-primary/30">
                  {p.badge}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-300 font-medium">{p.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{p.tagline}</div>
                </div>
                {p.socialProof && (
                  <div className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-semibold">
                    {p.socialProof}
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-6xl font-bold tracking-tight">{p.price}</span>
                <span className="text-ink-500 ml-1">{p.period}</span>
              </div>
              <p className="mt-3 text-ink-300 text-sm">{p.desc}</p>
              <a
                href={p.href}
                className={p.highlighted ? "btn-primary w-full mt-6" : "btn-ghost w-full mt-6"}
              >
                {p.cta} →
              </a>
              {p.highlighted && (
                <div className="mt-3 text-center text-xs text-ink-500">
                  ⚡ Setup em 5 minutos · Sem fidelidade
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selo de garantia */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="card p-6 bg-gradient-to-r from-primary/[0.05] via-card to-accent-blue/[0.05] border-primary/20">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="size-14 shrink-0 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <svg className="size-7 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3zm-1 14l-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">Garantia de 7 dias</div>
                <div className="text-sm text-ink-300 mt-1">
                  Não gostou no primeiro disparo? Devolvemos 100% do dinheiro, sem perguntas. Você só corre o risco de vender mais.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela comparativa */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold">Compare os planos</h3>
            <p className="text-ink-400 text-sm mt-2">Tudo que vem em cada um — sem surpresa</p>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/[0.03] border-b border-white/[0.08]">
                <tr>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-ink-400 font-semibold">Recurso</th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-ink-400 font-semibold">Starter</th>
                  <th className="px-5 py-4 text-center bg-primary/[0.04]">
                    <div className="text-xs uppercase tracking-wider text-primary font-bold">Pro</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {FEATURES.map((f) => (
                  <tr key={f.label} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-sm text-ink-200">{f.label}</td>
                    <td className="px-5 py-3.5 text-center text-sm">
                      <Cell value={f.free} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm bg-primary/[0.02]">
                      <Cell value={f.pro} highlighted />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-400">
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5l-8-3z"/></svg>
            Pagamento seguro via Stripe
          </span>
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
            7 dias de garantia
          </span>
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            LGPD compliant
          </span>
          <span className="inline-flex items-center gap-2">
            <span>📞</span>
            Suporte humano em PT-BR
          </span>
        </div>
      </div>
    </section>
  );
}

function Cell({ value, highlighted }) {
  if (value === true) {
    return (
      <span className={`inline-flex size-6 rounded-full items-center justify-center ${highlighted ? "bg-primary/20 text-primary" : "bg-white/5 text-primary"}`}>
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clipRule="evenodd"/></svg>
      </span>
    );
  }
  if (value === false) {
    return <span className="text-ink-500 text-base">—</span>;
  }
  return <span className={`font-medium ${highlighted ? "text-primary" : "text-ink-200"}`}>{value}</span>;
}
