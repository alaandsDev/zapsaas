// Fonte única do FAQ: alimenta o componente visível e o JSON-LD da home.
//
// O Google exige que a pergunta e a resposta do FAQPage existam visíveis na
// página — se os dois divergirem, o rich result é ignorado. Manter aqui evita
// que um lado seja atualizado sem o outro.
export const FAQS = [
  {
    q: "A entrega das campanhas é estável e segura?",
    a: "Sim. A Wayvo usa engine de estabilidade com cadência inteligente, intervalos randomizados e balanceamento entre canais (até 2 canais alternando) — entrega consistente e operação saudável.",
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
    a: "Pro custa R$ 47/mês: campanhas ilimitadas, 2 canais com balanceamento inteligente, CRM conversacional ilimitado, Workflow Builder com IA, Revenue Ops (ROI por campanha), analytics em tempo real e suporte prioritário. Assina pelo cartão, cancela quando quiser e sem fidelidade. Para volume alto ou API oficial da Meta, montamos uma proposta.",
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

export const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
