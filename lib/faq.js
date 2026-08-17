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
    q: "Como funciona o teste de 7 dias?",
    a: "Você cadastra o cartão no início pra garantir sua vaga, mas não é cobrado nada nesses 7 dias — a cobrança só entra depois do 7º dia de uso. Se cancelar antes disso, não paga nada.",
  },
  {
    q: "Quanto custa o Starter e o que vem incluído?",
    a: "Starter custa R$ 97,90/mês: campanhas ilimitadas, 2 canais com balanceamento inteligente, CRM conversacional ilimitado, automação com IA que monta o fluxo pra você, receita rastreada por campanha, relatórios em tempo real e suporte prioritário. 7 dias de teste, cancela quando quiser e sem fidelidade.",
  },
  {
    q: "O que o Pro tem a mais que o Starter?",
    a: "Tudo do Starter, mais o Agente de IA: por R$ 197,90/mês você treina o agente (com instruções e perguntas frequentes do seu negócio) e ele passa a responder sozinho no WhatsApp, sem precisar de alguém online o tempo todo. Também tem 7 dias de teste.",
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
