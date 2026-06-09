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
