// Fonte de conteúdo do blog. Cada post é renderizado em /blog/[slug].
// content: blocos simples (h2, p, ul, cta) — sem dependência de markdown.

export const POSTS = [
  {
    slug: "disparo-em-massa-whatsapp-sem-ban",
    title: "Como fazer disparo em massa no WhatsApp sem tomar ban (guia 2026)",
    description:
      "Disparo em massa no WhatsApp funciona — se feito do jeito certo. Veja as técnicas de cadência, aquecimento e personalização para vender sem bloquear seu número.",
    excerpt:
      "O ban não vem do volume — vem do padrão. Entenda como enviar campanhas em massa mantendo seu número saudável.",
    tag: "Marketing",
    date: "2026-06-09",
    readingMinutes: 6,
    cover: { from: "#00FF88", to: "#00D1FF", icon: "📢" },
    content: [
      { type: "p", text: "Disparo em massa no WhatsApp é uma das formas mais baratas e eficazes de vender no Brasil — quando feito do jeito certo. O problema é que a maioria das pessoas faz errado, dispara igual robô, e toma bloqueio no primeiro dia. Neste guia você vai entender por que o ban acontece e como evitá-lo." },
      { type: "h2", text: "Por que o WhatsApp bloqueia números" },
      { type: "p", text: "O WhatsApp não bloqueia por volume — bloqueia por padrão suspeito. O algoritmo detecta comportamento de robô: mensagens idênticas, enviadas em sequência instantânea, para números que nunca te responderam." },
      { type: "ul", items: [
        "Mensagens 100% iguais para todo mundo (sem personalização)",
        "Envio instantâneo, dezenas por segundo",
        "Número novo, sem histórico de conversas reais",
        "Muitos bloqueios e denúncias dos destinatários",
      ] },
      { type: "h2", text: "As 5 técnicas para disparar com segurança" },
      { type: "p", text: "Mantendo o comportamento parecido com o de um humano, o risco cai drasticamente. Na prática:" },
      { type: "ul", items: [
        "Cadência inteligente: intervalo de 2 a 5 segundos entre envios, com variação aleatória.",
        "Personalização real: use o nome do contato e variações na mensagem, nunca texto idêntico.",
        "Aquecimento do número: comece com poucos envios por dia e aumente gradualmente.",
        "Liste limpa: envie só para quem optou por receber. Lista comprada = denúncia = ban.",
        "Multi-número: distribua o volume entre vários números (round-robin) para diluir o risco.",
      ] },
      { type: "h2", text: "Canal não-oficial x API oficial da Meta" },
      { type: "p", text: "Para operações que não podem correr risco nenhum de bloqueio (empresas grandes), existe a API oficial do WhatsApp (Cloud API). Ela tem custo por mensagem, mas zero risco de ban e SLA da Meta. Para a maioria dos pequenos negócios, o número próprio bem cuidado já resolve." },
      { type: "h2", text: "Como o Wayvo faz isso por você" },
      { type: "p", text: "O Wayvo aplica cadência inteligente, personalização com variáveis e distribuição entre números automaticamente — além de oferecer o canal oficial da Meta para quem precisa de garantia total. Você dispara em massa sem virar refém do medo de bloqueio." },
      { type: "cta", text: "Comece grátis e dispare com segurança", href: "/register" },
    ],
  },

  {
    slug: "crm-para-whatsapp-o-que-e",
    title: "CRM para WhatsApp: o que é e por que sua empresa precisa de um",
    description:
      "Um CRM conversacional organiza cada conversa do WhatsApp em um funil de vendas. Entenda como transformar bate-papo em receita previsível.",
    excerpt:
      "Sem CRM, cada conversa some no histórico. Com CRM, vira lead, etapa e venda rastreável.",
    tag: "Vendas",
    date: "2026-06-09",
    readingMinutes: 5,
    cover: { from: "#8b5cf6", to: "#00D1FF", icon: "📊" },
    content: [
      { type: "p", text: "A maioria das empresas vende pelo WhatsApp, mas trata o WhatsApp como um caderno bagunçado: conversas se perdem, ninguém sabe quem está pra fechar, e o follow-up nunca acontece. Um CRM conversacional resolve isso transformando cada conversa em um lead organizado dentro de um funil." },
      { type: "h2", text: "O que é um CRM conversacional" },
      { type: "p", text: "É um CRM que nasce dentro do WhatsApp. Cada contato que te chama vira automaticamente um lead, com nome, telefone, histórico da conversa, score (quão quente está) e a etapa do funil em que se encontra." },
      { type: "h2", text: "Por que isso muda o jogo" },
      { type: "ul", items: [
        "Nenhum lead se perde — todo contato vira um card no pipeline.",
        "Você sabe quem priorizar — o score mostra quem está pronto pra comprar.",
        "Follow-up automático — leads parados são reativados sem você lembrar.",
        "Visão de receita — quanto tem em negociação e o que está pra fechar.",
      ] },
      { type: "h2", text: "Funil de vendas no WhatsApp na prática" },
      { type: "p", text: "Um funil simples: Novo Lead → Em Atendimento → Qualificado → Proposta → Fechado. Conforme você conversa, o lead avança nas etapas — manualmente ou automaticamente, conforme a interação." },
      { type: "h2", text: "Como o Wayvo faz isso" },
      { type: "p", text: "No Wayvo, todo contato do WhatsApp vira lead no CRM com score automático. A IA qualifica quem respondeu, move pelo funil e te avisa onde agir. É pipeline de vendas e inbox de WhatsApp no mesmo lugar." },
      { type: "cta", text: "Organize suas vendas no WhatsApp", href: "/register" },
    ],
  },

  {
    slug: "recuperar-clientes-inativos-whatsapp",
    title: "Como recuperar clientes inativos pelo WhatsApp (e faturar com quem já te conhece)",
    description:
      "Reativar um cliente antigo custa muito menos que conquistar um novo. Veja a estratégia de reativação pelo WhatsApp que gera caixa rápido.",
    excerpt:
      "Sua maior mina de ouro não é cliente novo — é o antigo que parou de comprar. Veja como trazê-lo de volta.",
    tag: "Estratégia",
    date: "2026-06-08",
    readingMinutes: 5,
    cover: { from: "#f59e0b", to: "#00FF88", icon: "🔄" },
    content: [
      { type: "p", text: "Empresas gastam fortunas atraindo clientes novos e esquecem a mina de ouro que já têm: a base de quem já comprou e sumiu. Reativar é mais barato, mais rápido e converte mais — porque a pessoa já confia em você." },
      { type: "h2", text: "Por que reativação funciona tão bem" },
      { type: "ul", items: [
        "O cliente já te conhece — não precisa quebrar a barreira da desconfiança.",
        "Você já tem o número dele — custo de aquisição zero.",
        "A taxa de resposta de uma base própria é muito maior que de lista fria.",
      ] },
      { type: "h2", text: "A estratégia de reativação em 3 passos" },
      { type: "ul", items: [
        "Segmente: liste quem não compra há 30, 60 ou 90 dias.",
        "Ofereça um motivo: condição especial, novidade, ou só um 'sentimos sua falta'.",
        "Personalize: use o nome e, se possível, referencie a última compra.",
      ] },
      { type: "h2", text: "Exemplo de mensagem que reativa" },
      { type: "p", text: "\"Oi {nome}! Faz um tempinho que você não aparece por aqui. Separei uma condição especial só pra você voltar essa semana. Posso te mostrar?\" — simples, pessoal e com chamada pra ação." },
      { type: "h2", text: "Como automatizar isso no Wayvo" },
      { type: "p", text: "O Wayvo identifica leads inativos automaticamente (pelo tempo sem interação) e dispara campanhas de reativação personalizadas, com cadência segura pra não bloquear seu número. Você transforma base parada em venda no piloto automático." },
      { type: "cta", text: "Reative sua base e venda mais", href: "/register" },
    ],
  },

  {
    slug: "whatsapp-business-api-oficial-vale-a-pena",
    title: "WhatsApp Business API oficial: vale a pena? (guia 2026)",
    description:
      "A API oficial da Meta tem custo por mensagem, mas zero risco de ban. Entenda quando vale migrar e quando o número próprio já resolve.",
    excerpt:
      "Número próprio ou API oficial? A resposta depende do seu risco de ban e do seu volume. Veja o comparativo.",
    tag: "Técnico",
    date: "2026-06-07",
    readingMinutes: 6,
    cover: { from: "#00D1FF", to: "#8b5cf6", icon: "🛡️" },
    content: [
      { type: "p", text: "Existem duas formas de operar no WhatsApp para empresas: usar um número próprio (não-oficial, via apps de automação) ou a API oficial da Meta (Cloud API). Cada uma tem prós e contras — e a escolha errada custa caro." },
      { type: "h2", text: "Número próprio (não-oficial)" },
      { type: "ul", items: [
        "Vantagem: grátis (sem custo por mensagem), conecta em segundos via QR Code.",
        "Risco: pode tomar bloqueio se usado de forma agressiva ou com lista fria.",
        "Ideal para: pequenos e médios negócios com cuidado na cadência.",
      ] },
      { type: "h2", text: "API oficial da Meta (Cloud API)" },
      { type: "ul", items: [
        "Vantagem: zero risco de ban, SLA da Meta, selo de empresa verificada.",
        "Custo: paga por mensagem/conversa (utility é barato, marketing custa mais).",
        "Ideal para: empresas grandes que não podem correr risco nenhum de bloqueio.",
      ] },
      { type: "h2", text: "Então qual escolher?" },
      { type: "p", text: "Se você é um pequeno negócio e cuida da cadência, o número próprio resolve e sai de graça. Se você é (ou atende) uma empresa grande, com marca a proteger e volume alto, a API oficial é o caminho — o custo por mensagem é o preço da tranquilidade." },
      { type: "h2", text: "O melhor dos dois mundos" },
      { type: "p", text: "O Wayvo suporta os dois canais na mesma plataforma: número próprio para o dia a dia e API oficial para operações críticas. Você escolhe por cliente, sem trocar de ferramenta." },
      { type: "cta", text: "Use os dois canais no Wayvo", href: "/register" },
    ],
  },

  {
    slug: "chatbot-whatsapp-atendimento-automatico",
    title: "Chatbot no WhatsApp: como automatizar o atendimento sem perder o toque humano",
    description:
      "Um bom chatbot responde na hora, qualifica o lead e passa pro humano no momento certo. Veja como automatizar sem parecer robô.",
    excerpt:
      "Chatbot bom não substitui o humano — ele filtra, responde o óbvio e entrega o lead pronto pra você fechar.",
    tag: "Automação",
    date: "2026-06-06",
    readingMinutes: 5,
    cover: { from: "#00FF88", to: "#f59e0b", icon: "🤖" },
    content: [
      { type: "p", text: "Cliente que manda mensagem e demora pra ser respondido vai embora. Um chatbot no WhatsApp resolve isso respondendo na hora, 24/7 — mas o segredo é não transformar o atendimento num labirinto robótico." },
      { type: "h2", text: "O que um bom chatbot deve fazer" },
      { type: "ul", items: [
        "Responder na hora as dúvidas mais comuns (horário, preço, endereço).",
        "Qualificar o lead com 2-3 perguntas rápidas antes de chamar o humano.",
        "Passar pro atendente no momento certo, com o contexto já coletado.",
        "Nunca prender o cliente — sempre ter a opção 'falar com atendente'.",
      ] },
      { type: "h2", text: "Os erros que fazem o cliente odiar seu bot" },
      { type: "ul", items: [
        "Menu infinito de números que não leva a lugar nenhum.",
        "Não entender o que o cliente escreve e repetir a mesma resposta.",
        "Nunca oferecer atendimento humano.",
      ] },
      { type: "h2", text: "Automação + humano = combinação que vende" },
      { type: "p", text: "O ideal é o bot fazer o trabalho chato (triagem, dúvidas repetidas, coleta de dados) e o humano entrar pra fechar a venda, quando o lead já está qualificado e aquecido. Você atende mais gente com a mesma equipe." },
      { type: "h2", text: "Como montar isso no Wayvo" },
      { type: "p", text: "No Wayvo você cria fluxos de atendimento visuais — sem programar — que qualificam o lead e acionam o humano na hora certa. E o copiloto de IA ainda sugere a melhor resposta em cada conversa." },
      { type: "cta", text: "Automatize seu atendimento no WhatsApp", href: "/register" },
    ],
  },
];

export function getAllPosts() {
  return [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
