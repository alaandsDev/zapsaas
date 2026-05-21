import Link from "next/link";
import Logo from "../Logo";

const HIGHLIGHTS = [
  {
    title: "Disparos em massa no WhatsApp",
    desc: "Envie campanhas para milhares de contatos com round-robin de mensagens e variáveis personalizadas.",
  },
  {
    title: "Chatbot e automações 24/7",
    desc: "Atenda leads automaticamente, qualifique e converta enquanto você dorme.",
  },
  {
    title: "Painel completo de vendas",
    desc: "Acompanhe leads, contatos, histórico de disparos e estatísticas em tempo real.",
  },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LADO ESQUERDO — destaque do sistema */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-bg via-bg to-primary/10">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <Link href="/" className="relative z-10 flex items-center gap-2" aria-label="Wayvo">
          <Logo size={32} />
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Venda mais no WhatsApp.<br />
            <span className="text-primary">No automático.</span>
          </h2>
          <p className="text-ink-300 mt-4 text-lg">
            A plataforma completa para escalar suas vendas com disparos, chatbot e automações.
          </p>

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-4">
                <div className="shrink-0 size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <svg className="size-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">{h.title}</h3>
                  <p className="text-ink-300 text-sm mt-1">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-ink-400">
          © {new Date().getFullYear()} Wayvo · Todos os direitos reservados
        </div>
      </div>

      {/* LADO DIREITO — formulário */}
      <div className="flex items-center justify-center px-6 py-12 relative">
        <Link href="/" className="lg:hidden absolute top-6 left-6 flex items-center gap-2" aria-label="Wayvo">
          <Logo size={28} />
        </Link>
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-ink-300 mt-2 text-sm">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="text-center text-sm text-ink-300 mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
