import NicheLanding from "../../components/NicheLanding";
import JsonLd from "../../components/JsonLd";
import { OG_IMAGE } from "../../lib/seo";

const URL = "https://www.wayvo.app.br/delivery";

export const metadata = {
  title: "Wayvo para Delivery — Mais pedidos pelo WhatsApp",
  description:
    "Sistema de vendas automáticas pelo WhatsApp para delivery e restaurantes. Promoções, recorrência e clientes voltando — sem pagar 30% para plataforma.",
  keywords: [
    "whatsapp para delivery",
    "marketing para delivery",
    "promoção whatsapp restaurante",
    "vendas direto whatsapp delivery",
    "fugir do ifood",
    "recorrência clientes restaurante",
    "crm para restaurantes",
  ],
  alternates: { canonical: "/delivery" },
  openGraph: {
    url: URL,
    title: "Wayvo para Delivery — Mais pedidos no automático",
    description:
      "Promoções, recorrência e clientes fiéis pelo WhatsApp. Sem pagar 30% para plataforma.",
    images: OG_IMAGE,
  },
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.wayvo.app.br/" },
    { "@type": "ListItem", position: 2, name: "Delivery", item: URL },
  ],
};

export default function Page() {
  return (
    <>
    <JsonLd data={BREADCRUMB} />
    <NicheLanding
      eyebrow="Wayvo para Delivery"
      heroTitle="Aumente seus pedidos todos os dias pelo"
      heroHighlight="WhatsApp automaticamente"
      heroSubtitle="Pare de pagar 30% pra plataforma. Venda direto pelo seu WhatsApp, traga o cliente de volta toda semana e dobre seu ticket — sem mexer um dedo."
      ctaLabel="Quero mais pedidos"
      benefitsTitle="Mais pedidos. Mais margem. Cliente fiel."
      benefits={[
        { icon: "cardapio", title: "Promoções que viram pedido", desc: "Promoção de quinta, combo do fim de semana, oferta-relâmpago. Wayvo dispara pra base toda e os pedidos chegam." },
        { icon: "recorrencia", title: "Cliente voltando todo mês", desc: "Quem pediu uma vez recebe a mensagem certa pra pedir de novo. Recorrência sem depender de plataforma cara." },
        { icon: "margem", title: "Margem de volta no seu bolso", desc: "Venda direto pelo WhatsApp e fuja da taxa de 27% das plataformas. Cada pedido vale mais." },
        { icon: "presente", title: "Aniversário e datas especiais", desc: "Mensagem automática no aniversário com oferta. Cliente lembra de você no momento que conta." },
      ]}
      steps={[
        { title: "Conecte o WhatsApp do delivery", desc: "Sem trocar número. Em 30 segundos seu WhatsApp vira uma máquina de pedidos." },
        { title: "Importe sua lista de clientes", desc: "Cole os contatos da agenda, do iFood, da planilha. Wayvo organiza e segmenta automaticamente." },
        { title: "Dispare a promoção e relaxe", desc: "Os pedidos começam a chegar. Você só prepara, embala e entrega." },
      ]}
      stats={[
        { value: "+62", label: "pedidos extras por campanha (média)" },
        { value: "30%", label: "de margem que volta pro seu caixa" },
        { value: "2x", label: "frequência de retorno do cliente" },
      ]}
      testimonials={[
        { name: "Diego P.", role: "Hamburgueria · São Paulo", quote: "Quinta de promoção: mando o disparo às 18h, às 19h o forno não para. Faturo num dia o que faturava em 3.", color: "#00FFB2" },
        { name: "Bruna A.", role: "Pizzaria · Salvador", quote: "Saí do iFood. Vendo direto pelo WhatsApp e meu lucro dobrou. Wayvo paga 50 vezes a mensalidade.", color: "#3B82F6" },
        { name: "Lucas G.", role: "Açaí e sobremesas · Fortaleza", quote: "Cliente que tinha sumido voltou em peso. A campanha de domingo virou meu melhor dia da semana.", color: "#8B5CF6" },
      ]}
      finalCTA={{
        title: "Cada pedido perdido é margem indo pro concorrente",
        subtitle: "Seus clientes estão no WhatsApp. Falta você falar com eles na hora certa. Ative o Wayvo e veja os pedidos chegando.",
      }}
    />
    </>
  );
}
