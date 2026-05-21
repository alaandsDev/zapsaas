export default function CTASection({
  title = "Sua operação no WhatsApp pode estar perdendo receita todo dia",
  subtitle = "Cada conversa sem resposta vira venda do concorrente. Com a Wayvo, CRM conversacional + automação + IA transformam cada contato em receita previsível.",
  cta = { label: "Ativar agora — começar grátis", href: "/register" },
}) {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-10 lg:p-16 text-center bg-gradient-to-br from-card via-card/80 to-bg">
          <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-[400px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-h2 max-w-3xl mx-auto">{title}</h2>
            <p className="mt-5 text-lg text-ink-300 max-w-2xl mx-auto">{subtitle}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href={cta.href} className="btn-primary text-base">
                {cta.label} →
              </a>
            </div>
            <p className="mt-5 text-sm text-ink-500">
              Sem cartão · Cancele quando quiser · Operação no ar em 5 minutos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
