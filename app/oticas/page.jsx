import NicheLanding from "../../components/NicheLanding";
import JsonLd from "../../components/JsonLd";

const URL = "https://zapflow.vercel.app/oticas";

export const metadata = {
  title: "Wayvo para Óticas — Reative pacientes e venda mais",
  description:
    "Sistema de vendas automáticas pelo WhatsApp para óticas. Reative pacientes, aumente vendas de óculos, lentes e segundo par no automático.",
  keywords: [
    "whatsapp para óticas",
    "marketing para óticas",
    "reativação de pacientes ótica",
    "vendas óculos whatsapp",
    "campanha segundo par",
    "crm para óticas",
  ],
  alternates: { canonical: "/oticas" },
  openGraph: {
    url: URL,
    title: "Wayvo para Óticas — Reative pacientes no automático",
    description:
      "Reative pacientes, venda segundo par e lentes pelo WhatsApp.",
  },
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://zapflow.vercel.app/" },
    { "@type": "ListItem", position: 2, name: "Óticas", item: URL },
  ],
};

export default function Page() {
  return (
    <>
    <JsonLd data={BREADCRUMB} />
    <NicheLanding
      eyebrow="Wayvo para Óticas"
      heroTitle="Transforme pacientes da clínica em"
      heroHighlight="clientes na sua ótica automaticamente"
      heroSubtitle="Pare de depender só de quem entra na loja. Reative quem já passou pela clínica e venda óculos, lentes e segundo par — todos os dias, no automático."
      ctaLabel="Quero ativar na minha ótica"
      benefitsTitle="Sua ótica vendendo enquanto você atende"
      benefits={[
        { icon: "👓", title: "Reative pacientes que sumiram", desc: "Aquele cliente que comprou há 1 ano e nunca mais voltou recebe a mensagem certa e volta pra trocar a armação." },
        { icon: "💎", title: "Venda segundo par e lente solar", desc: "Ofertas inteligentes pra quem já comprou de você. O cliente certo, na hora certa, com a oferta certa." },
        { icon: "📅", title: "Lembrete de troca de lentes", desc: "Avisa automaticamente quem está na hora de trocar grau, lente de contato ou armação. Venda recorrente garantida." },
        { icon: "🎯", title: "Promoções que dão resultado", desc: "Black Friday, Dia das Mães, Pais — campanhas prontas que disparam pra base toda em segundos." },
      ]}
      steps={[
        { title: "Conecte o WhatsApp da ótica", desc: "Liga seu número ao Wayvo em 30 segundos. Mantém o mesmo número que seus clientes já conhecem." },
        { title: "Importe seus pacientes/clientes", desc: "Cole a lista da clínica, do sistema da ótica ou da agenda. Wayvo organiza tudo automaticamente." },
        { title: "Ative a campanha e venda", desc: "Escolha o template (reativação, segundo par, troca de lente) e dispare. As vendas começam a chegar." },
      ]}
      stats={[
        { value: "+R$8k", label: "em vendas no primeiro disparo (média)" },
        { value: "23%", label: "de taxa de retorno de pacientes" },
        { value: "5min", label: "pra ativar a primeira campanha" },
      ]}
      testimonials={[
        { name: "Marcelo S.", role: "Ótica Vista Clara · Curitiba", quote: "Mandei pra base de pacientes da clínica num sábado. Segunda de manhã tinha 14 pessoas marcando exame de novo. Faturei R$ 11 mil naquela semana.", color: "#00FFB2" },
        { name: "Patrícia L.", role: "Ótica Olhar · Goiânia", quote: "A campanha de segundo par sozinha já paga o sistema dez vezes. Mando uma vez por mês e sempre vem venda.", color: "#3B82F6" },
        { name: "Rodrigo F.", role: "Rede de óticas · Interior SP", quote: "Tinha 4 mil pacientes na planilha sem fazer nada. Em 30 dias virei meu mês: faturamento dobrou.", color: "#8B5CF6" },
      ]}
      finalCTA={{
        title: "Sua base de pacientes vale ouro — está na hora de ativar",
        subtitle: "Cada paciente esquecido é uma venda indo pro concorrente. Ative o Wayvo e transforme sua agenda em faturamento previsível.",
      }}
    />
    </>
  );
}
