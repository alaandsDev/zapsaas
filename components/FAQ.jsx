"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "A entrega das campanhas é estável e segura?",
    a: "Sim. A Wayvo usa engine de estabilidade com cadência inteligente, intervalos randomizados e balanceamento entre canais (até 2 canais alternando) — entrega consistente e operação saudável. Mais de 200 operações ativas há +6 meses.",
  },
  {
    q: "Funciona com meu WhatsApp atual ou preciso de chip novo?",
    a: "Funciona com qualquer WhatsApp — você conecta seu número via QR Code em 30 segundos, sem trocar de chip. Para volume alto, recomendamos um canal dedicado para isolar o número de uso pessoal.",
  },
  {
    q: "Existe plano gratuito de verdade?",
    a: "Sim. O Starter é grátis pra sempre, sem cartão. Você opera até 3 campanhas/mês, 50 leads no CRM e já tem o Wayvo AI Copilot em modo básico. Suficiente pra validar antes de pagar.",
  },
  {
    q: "Quanto custa o Pro e o que vem incluído?",
    a: "Pro custa R$ 47/mês: campanhas ilimitadas, 2 canais com balanceamento inteligente, CRM conversacional ilimitado, Workflow Builder com IA, Revenue Ops (ROI por campanha), analytics em tempo real e suporte prioritário.",
  },
  {
    q: "Quanto tempo leva pra ver resultado?",
    a: "Donos de negócio reportam primeiras vendas no mesmo dia da configuração. Em 7 dias a média é +37 vendas extras. O segredo é falar com a base de contatos parada que você já tem.",
  },
  {
    q: "E se eu quiser cancelar?",
    a: "Cancela com 1 clique no painel, sem multa, sem perguntas. Você mantém acesso até o fim do período pago e seus dados ficam guardados por 30 dias caso queira voltar.",
  },
  {
    q: "Funciona pra clínica / delivery / imobiliária / ótica?",
    a: "Sim, e temos templates prontos pra cada um. Clínica: agendamento e confirmação automática. Delivery: campanhas de promoção e recorrência. Imobiliária: follow-up de leads. Ótica: reativação e segundo par.",
  },
  {
    q: "Posso enviar mídia (imagem, vídeo, áudio, PDF)?",
    a: "Sim. A Wayvo suporta imagens, vídeos, áudios e documentos em qualquer campanha ou fluxo. Útil pra catálogo, panfletos, áudios personalizados e PDFs de orçamento.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Dúvidas frequentes
          </div>
          <h2 className="text-h2">Tudo que você precisa saber<br />antes de começar</h2>
          <p className="text-ink-300 mt-4 text-lg">
            Não achou a resposta? <a href="#" className="text-primary hover:underline">Fale com a gente</a>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`glass overflow-hidden transition-all ${isOpen ? "border-primary/30" : "hover:border-white/15"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className={`font-semibold ${isOpen ? "text-primary" : "text-ink-100"}`}>{item.q}</span>
                  <span className={`shrink-0 size-7 rounded-full border flex items-center justify-center text-sm transition-all ${
                    isOpen ? "bg-primary text-bg border-primary rotate-45" : "border-white/15 text-ink-400"
                  }`}>+</span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-ink-300 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
