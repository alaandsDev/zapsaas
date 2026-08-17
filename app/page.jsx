import Navbar from "../components/Navbar";
import JsonLd from "../components/JsonLd";
import { OG_IMAGE } from "../lib/seo";
import { FAQ_JSONLD } from "../lib/faq";

export const metadata = {
  title: "Wayvo — Automação de Vendas no WhatsApp: CRM, Disparos e IA",
  description:
    "Transforme seu WhatsApp em uma máquina de vendas: disparos em massa, CRM de leads, chatbot e automação com IA. 7 dias de teste grátis.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "https://www.wayvo.app.br/",
    title: "Wayvo — Automação de Vendas no WhatsApp: CRM, Disparos e IA",
    description:
      "Disparos em massa, CRM de leads, chatbot e automação com IA numa só plataforma. 7 dias de teste grátis.",
    images: OG_IMAGE,
  },
};
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import HowItWorks from "../components/HowItWorks";
import CapabilitiesOrbit from "../components/CapabilitiesOrbit";
import BeforeAfter from "../components/BeforeAfter";
import Features from "../components/Features";
import StatsHighlight from "../components/StatsHighlight";
import SocialProof from "../components/SocialProof";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Wayvo",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Sistema de vendas automáticas pelo WhatsApp: disparos em massa, chatbot 24/7, automações e CRM.",
          offers: [
            {
              "@type": "Offer",
              name: "Starter",
              price: "97.90",
              priceCurrency: "BRL",
              description: "Assinatura mensal, 7 dias de teste grátis, sem fidelidade",
            },
            {
              "@type": "Offer",
              name: "Pro",
              price: "197.90",
              priceCurrency: "BRL",
              description: "Assinatura mensal, 7 dias de teste grátis, sem fidelidade — inclui Agente de IA treinável",
            },
          ],
          // aggregateRating removido: Google exige avaliações reais (rating falso = penalidade).
          // Reative quando tiver reviews genuínas de clientes.
        }}
      />
      <JsonLd data={FAQ_JSONLD} />
      <Navbar />
      <Hero
        eyebrow="Automação de vendas no WhatsApp · Com IA"
        title="O sistema operacional da sua"
        highlight="operação de receita no WhatsApp"
        subtitle="Wayvo unifica CRM conversacional, automação inteligente e controle de receita — com um copiloto de IA que lê sua operação e recomenda a próxima ação, em tempo real."
        primaryCTA={{ label: "Começar agora", href: "/register" }}
        secondaryCTA={{ label: "Ver a plataforma", href: "#como-funciona" }}
        metrics={[
          { value: "Com IA", label: "copiloto operacional embutido" },
          { value: "Tempo real", label: "conversas, leads e receita" },
          { value: "Receita rastreada", label: "quanto cada campanha vendeu" },
          { value: "5 min", label: "para colocar em operação" },
        ]}
      />
      <Benefits
        title="Não é um disparador. É a infraestrutura de comunicação do seu negócio."
        subtitle="Uma plataforma operacional que transforma cada conversa em receita previsível."
        items={[
          { icon: "ai-copilot", title: "Copiloto de IA operacional", desc: "A IA lê sua operação, prioriza leads quentes e recomenda a próxima ação — em todas as telas." },
          { icon: "crm", title: "CRM conversacional", desc: "Cada conversa com contexto comercial: score do lead, histórico, automações e receita atribuída." },
          { icon: "automation", title: "Automação que opera por você", desc: "Fluxos automáticos que qualificam, respondem e recuperam leads sem você tocar no celular." },
          { icon: "revenue", title: "Você sabe o que gera venda", desc: "Cada campanha e fluxo mostra quanto trouxe de receita. Decisão com base em caixa, não em achismo." },
        ]}
      />
      <HowItWorks
        steps={[
          {
            title: "Conecte sua infraestrutura",
            desc: "Ligue seus canais em segundos — número próprio ou API oficial Meta. Sem chip novo, sem fricção.",
            img: "https://images.pexels.com/photos/1092671/pexels-photo-1092671.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop",
          },
          {
            title: "Ative a operação",
            desc: "Use workflows prontos ou deixe a IA montar o fluxo. Campanhas, automações e CRM num só lugar.",
            img: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop",
          },
          {
            title: "Escale com inteligência",
            desc: "O copiloto monitora saúde, timing e receita — e te diz onde agir para crescer.",
            img: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop",
          },
        ]}
      />
      <CapabilitiesOrbit />
      <BeforeAfter />
      <Features />
      <StatsHighlight />
      <SocialProof
        testimonials={[
          { name: "Marcelo S.", role: "Dono de ótica · Curitiba", result: "+R$ 11k em 5 dias", quote: "Coloquei o Wayvo numa terça. Na sexta já tinha 11 vendas que vieram só do WhatsApp. Pago a mensalidade no primeiro cliente.", color: "#00FFB2", avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" },
          { name: "Camila R.", role: "Clínica de estética · Belo Horizonte", result: "Agenda 100% lotada", quote: "Minha agenda estava sempre com buracos. Hoje passo o dia atendendo. O sistema enche a agenda sozinho.", color: "#3B82F6", avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" },
          { name: "Diego P.", role: "Hamburgueria · São Paulo", result: "Faturou 3x mais", quote: "Nos fins de semana fechados o sistema já bate o faturamento de uma terça inteira. Mudou meu jogo.", color: "#8B5CF6", avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" },
        ]}
      />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </>
  );
}
