import { Sparkles, GitBranch, Check, MoreVertical, Mic } from "lucide-react";
import Reveal from "./ui/Reveal";

const SHOWCASES = [
  {
    badgeIcon: Sparkles,
    badgeLabel: "Copiloto de IA",
    title: "A IA que lê sua operação e te diz o que fazer",
    desc: "O Wayvo AI Copilot cruza conversas, leads e histórico de vendas pra te dizer exatamente onde agir agora — sem você precisar caçar informação em painel nenhum.",
    checklist: [
      "Score de leads em tempo real",
      "Melhor horário pra abordar cada contato",
      "Alertas de saúde da operação",
      "Resumo do dia direto no WhatsApp",
    ],
    mockupSide: "left",
    contact: { name: "Wayvo AI", role: "Copiloto", initials: "AI" },
    messages: [
      { side: "in", text: "Bom dia! Como tá minha operação hoje?" },
      { side: "out", text: "Bom dia! 🌤️ 3 leads esfriando, 1 fatura vencendo amanhã e sua melhor janela de disparo hoje é 18h–20h." },
      { side: "out", text: "Quer que eu já dispare o follow-up pros 3 leads?" },
    ],
  },
  {
    badgeIcon: GitBranch,
    badgeLabel: "Automação com IA",
    title: "Descreva o fluxo. A IA monta pra você.",
    desc: "Peça em uma frase e o Wayvo monta a automação inteira — qualificação, follow-up e recuperação de venda parada no automático, sem arrastar bloco nenhum se você não quiser.",
    checklist: [
      "Editor visual de automações",
      "IA monta o fluxo a partir de um pedido",
      "Qualificação e follow-up automáticos",
      "Recuperação de vendas paradas",
    ],
    mockupSide: "right",
    contact: { name: "Wayvo AI", role: "Automação", initials: "AI" },
    messages: [
      { side: "in", text: "Cria um fluxo pra reativar quem não compra há 30 dias" },
      { side: "out", text: 'Fluxo criado ✅ "Reativação 30 dias" — 3 etapas, já ativo.' },
      { side: "out", text: "Vou avisar assim que a primeira venda voltar 🚀" },
    ],
  },
];

export default function Features() {
  return (
    <section id="recursos" className="bg-[#ECEEF2] border-y border-[#E4E7EC] py-24">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mb-16">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            Recursos
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            Uma plataforma operacional completa — não um conjunto de ferramentas soltas
          </h2>
        </Reveal>

        <div className="space-y-20 lg:space-y-28">
          {SHOWCASES.map((s, i) => (
            <div key={i} className="grid lg:grid-cols-2 items-center gap-10 lg:gap-16">
              <Reveal className={s.mockupSide === "left" ? "lg:order-2" : ""}>
                <div className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-[#EAFBF1] border border-[#D2F0E0] mb-5">
                  <span className="flex items-center justify-center size-6 rounded-full bg-white text-[#0E8A47]">
                    <s.badgeIcon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="text-[12px] font-bold text-[#0E8A47]">{s.badgeLabel}</span>
                </div>
                <h3 className="text-[24px] sm:text-[30px] font-bold text-[#0A1020] leading-[1.15] tracking-[-0.02em]">
                  {s.title}
                </h3>
                <p className="mt-4 text-[16.5px] leading-relaxed text-[#4B5565]">{s.desc}</p>
                <ul className="mt-6 space-y-3">
                  {s.checklist.map((item, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <span className="flex items-center justify-center size-6 rounded-full bg-[#EAFBF1] border border-[#D2F0E0] text-[#0E8A47] shrink-0">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="text-[15px] text-[#3A4553]">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={120} className={s.mockupSide === "left" ? "lg:order-1" : ""}>
                <ChatCard contact={s.contact} messages={s.messages} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChatCard({ contact, messages }) {
  return (
    <div className="relative mx-auto max-w-[400px]">
      <div
        className="absolute -inset-6 rounded-[2.5rem] pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(14,138,71,0.14), transparent 70%)", filter: "blur(24px)" }}
      />
      <div className="relative rounded-[28px] overflow-hidden border border-[#E9ECF1] bg-white p-2 shadow-[0_26px_54px_-28px_rgba(10,16,32,0.32)]">
        {/* A tela mantém o skin escuro do WhatsApp — mockup realista dentro da moldura clara */}
        <div className="rounded-[22px] overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#1F2C34]">
            <div
              className="size-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0E8A47,#2F80ED)" }}
            >
              {contact.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold text-white leading-tight truncate">{contact.name}</div>
              <div className="text-[10.5px] text-[#25D366] leading-tight">{contact.role}</div>
            </div>
            <MoreVertical className="size-4 text-white/60 shrink-0" strokeWidth={2.25} />
          </div>

          <div
            className="space-y-2 px-3 py-4 min-h-[220px] bg-[#0B141A]"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-[13.5px] leading-snug shadow-sm ${
                  m.side === "out"
                    ? "ml-auto bg-[#005C4B] text-white rounded-tr-sm"
                    : "bg-[#202C33] text-white/90 rounded-tl-sm"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#1F2C34]">
            <div className="flex-1 h-8 rounded-full bg-white/[0.06] flex items-center px-3.5 text-[12px] text-white/35">
              Mensagem
            </div>
            <div className="size-8 rounded-full bg-[#0E8A47] flex items-center justify-center shrink-0">
              <Mic className="size-4 text-white" strokeWidth={2.25} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
