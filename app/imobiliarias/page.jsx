import NicheLanding from "../../components/NicheLanding";
import JsonLd from "../../components/JsonLd";

const URL = "https://zapflow.vercel.app/imobiliarias";

export const metadata = {
  title: "Wayvo para Imobiliárias — Leads em visitas e vendas",
  description:
    "Sistema de vendas automáticas pelo WhatsApp para imobiliárias e corretores. Follow-up automático, nutrição de leads e mais visitas agendadas.",
  keywords: [
    "whatsapp para imobiliárias",
    "crm imobiliário whatsapp",
    "follow-up corretor",
    "nutrição de leads imobiliária",
    "agendamento de visitas imóveis",
    "marketing imobiliário whatsapp",
  ],
  alternates: { canonical: "/imobiliarias" },
  openGraph: {
    url: URL,
    title: "Wayvo para Imobiliárias — Leads viram vendas",
    description:
      "Follow-up automático, nutrição de leads e visitas agendadas pelo WhatsApp.",
  },
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://zapflow.vercel.app/" },
    { "@type": "ListItem", position: 2, name: "Imobiliárias", item: URL },
  ],
};

export default function Page() {
  return (
    <>
    <JsonLd data={BREADCRUMB} />
    <NicheLanding
      eyebrow="Wayvo para Imobiliárias"
      heroTitle="Converta leads em visitas e vendas"
      heroHighlight="automaticamente pelo WhatsApp"
      heroSubtitle="80% das vendas perdidas são por falta de follow-up. O Wayvo nutri o lead, agenda a visita e mantém o contato quente — pra você só fechar."
      ctaLabel="Quero vender mais imóveis"
      benefitsTitle="Lead trabalhado, visita agendada, venda fechada"
      benefits={[
        { icon: "🏠", title: "Follow-up que não falha", desc: "Cada lead recebe a sequência certa de mensagens nos dias certos. Nada cai pelo vão da escada." },
        { icon: "📲", title: "Nutrição de leads automática", desc: "Manda fotos, vídeos, plantas e tour virtual no momento ideal. Lead frio vira lead quente sozinho." },
        { icon: "📅", title: "Agendamento de visitas", desc: "Lead interessado escolhe o horário direto pelo WhatsApp. Sua agenda enche sem você pegar no telefone." },
        { icon: "🎯", title: "Reativação de base parada", desc: "Aquele lead de 3 meses atrás que sumiu? Volta pra ativa com a oferta certa do imóvel ideal." },
      ]}
      steps={[
        { title: "Conecte o WhatsApp da imobiliária", desc: "30 segundos pra ligar seu número. Funciona com vários corretores ou um número central." },
        { title: "Importe seus leads e clientes", desc: "Da planilha, do CRM, da página de captura. Wayvo organiza por interesse, perfil e estágio do funil." },
        { title: "Ative o follow-up e venda mais", desc: "As mensagens disparam sozinhas. Você só atende quem está pronto pra visitar e fechar." },
      ]}
      stats={[
        { value: "3x", label: "mais visitas agendadas no primeiro mês" },
        { value: "80%", label: "menos leads perdidos por falta de follow-up" },
        { value: "+R$30k", label: "em comissão extra (média) por corretor" },
      ]}
      testimonials={[
        { name: "Felipe M.", role: "Corretor autônomo · São Paulo", quote: "Eu tinha 200 leads parados na planilha. Em 15 dias agendei 18 visitas e fechei 3 vendas. Comissão de R$ 42 mil que estava perdida.", color: "#00FFB2" },
        { name: "Imobiliária Norte", role: "Imóveis residenciais · Brasília", quote: "Cada corretor produzindo o dobro sem trabalhar mais. O sistema cuida do follow-up e eles só fecham.", color: "#3B82F6" },
        { name: "Carla S.", role: "Imóveis de alto padrão · Florianópolis", quote: "No alto padrão o lead precisa ser cuidado por meses. O Wayvo faz isso por mim com mensagem que parece pessoal. Já fechei 2 imóveis acima de R$ 2 mi com leads antigos.", color: "#8B5CF6" },
      ]}
      finalCTA={{
        title: "Cada lead sem follow-up é uma comissão indo pro concorrente",
        subtitle: "Seus leads estão prontos pra comprar — falta você manter o contato vivo. Ative o Wayvo e transforme sua carteira em vendas previsíveis.",
      }}
    />
    </>
  );
}
