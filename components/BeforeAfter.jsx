import Icon from "./ui/Icon";

const BEFORE = [
  { icon: "sem-resposta", text: "Cliente manda mensagem e fica horas sem resposta" },
  { icon: "planilha", text: "Lista de contatos parada na planilha — dinheiro morto" },
  { icon: "silencio", text: "Fim de semana e feriado: WhatsApp em silêncio total" },
  { icon: "repeticao", text: "Você respondendo a mesma pergunta 50 vezes por dia" },
  { icon: "venda-perdida", text: "Vendas perdidas porque ninguém deu follow-up" },
];

const AFTER = [
  { icon: "instantaneo", text: "Resposta automática personalizada em 1 segundo" },
  { icon: "disparo", text: "Reativa toda a base com 1 clique — vendas chegando" },
  { icon: "madrugada", text: "Vende dormindo, almoçando, no churrasco do domingo" },
  { icon: "bot", text: "Bot atende 80% das dúvidas, você fecha as vendas" },
  { icon: "timing", text: "Cada lead recebe a mensagem certa no momento certo" },
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
            O que muda quando a operação roda com CRM conversacional, automação e IA.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* ANTES */}
          <div className="glass p-7 relative overflow-hidden border-red-500/20">
            <div className="absolute -top-12 -right-12 size-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-bold mb-5 tracking-wide">
                <Icon name="x" className="size-3.5" strokeWidth={2.5} />
                ANTES DO WAYVO
              </div>
              <h3 className="text-xl font-bold text-ink-200 mb-5">Você refém do WhatsApp</h3>
              <ul className="space-y-3.5">
                {BEFORE.map((b, i) => (
                  <li key={i} className="flex items-center gap-3.5">
                    <span className="size-9 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-300/90">
                      <Icon name={b.icon} className="size-[18px]" />
                    </span>
                    <span className="text-sm text-ink-300 leading-snug">{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DEPOIS */}
          <div className="glass p-7 relative overflow-hidden border-primary/30 bg-gradient-to-b from-primary/[0.04] to-card">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold mb-5 tracking-wide">
                <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                COM O WAYVO
              </div>
              <h3 className="text-xl font-bold mb-5">WhatsApp trabalhando por você</h3>
              <ul className="space-y-3.5">
                {AFTER.map((a, i) => (
                  <li key={i} className="flex items-center gap-3.5">
                    <span className="size-9 shrink-0 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                      <Icon name={a.icon} className="size-[18px]" />
                    </span>
                    <span className="text-sm text-ink-100 leading-snug font-medium">{a.text}</span>
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
