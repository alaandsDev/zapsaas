const BEFORE = [
  { icon: "😩", text: "Cliente manda mensagem e fica horas sem resposta" },
  { icon: "📋", text: "Lista de contatos parada na planilha — dinheiro morto" },
  { icon: "🌙", text: "Fim de semana e feriado: WhatsApp em silêncio total" },
  { icon: "🔁", text: "Você respondendo a mesma pergunta 50 vezes por dia" },
  { icon: "💸", text: "Vendas perdidas porque ninguém deu follow-up" },
];

const AFTER = [
  { icon: "⚡", text: "Resposta automática personalizada em 1 segundo" },
  { icon: "🚀", text: "Reativa toda a base com 1 clique — vendas chegando" },
  { icon: "🌙", text: "Vende dormindo, almoçando, no churrasco do domingo" },
  { icon: "🤖", text: "Bot atende 80% das dúvidas, você fecha as vendas" },
  { icon: "📈", text: "Cada lead recebe a mensagem certa no momento certo" },
];

export default function BeforeAfter() {
  return (
    <section className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Antes vs Depois
          </div>
          <h2 className="text-h2">A diferença é<br />gritante.</h2>
          <p className="mt-4 text-ink-300 text-lg">
            Veja o que muda no seu dia-a-dia quando o Wayvo assume o WhatsApp.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* ANTES */}
          <div className="card p-7 relative overflow-hidden border-red-500/20">
            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-bold mb-5">
                <span>❌</span> ANTES DO WAYVO
              </div>
              <h3 className="text-xl font-bold text-ink-200 mb-5">Você refém do WhatsApp</h3>
              <ul className="space-y-3">
                {BEFORE.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="size-8 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-base">
                      {b.icon}
                    </span>
                    <span className="text-sm text-ink-300 leading-relaxed pt-1">{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DEPOIS */}
          <div className="card p-7 relative overflow-hidden border-primary/30 bg-gradient-to-b from-primary/[0.04] to-card">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold mb-5">
                <span>✓</span> COM O WAYVO
              </div>
              <h3 className="text-xl font-bold mb-5">WhatsApp trabalhando por você</h3>
              <ul className="space-y-3">
                {AFTER.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="size-8 shrink-0 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-base">
                      {a.icon}
                    </span>
                    <span className="text-sm text-ink-100 leading-relaxed pt-1 font-medium">{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA central */}
        <div className="mt-10 text-center">
          <a href="/register" className="btn-primary text-base inline-flex">
            Quero parar de perder vendas →
          </a>
          <p className="mt-3 text-xs text-ink-500">Configure em 5 minutos · Plano grátis</p>
        </div>
      </div>
    </section>
  );
}
