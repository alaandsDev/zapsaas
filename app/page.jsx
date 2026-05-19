import Navbar from "../components/Navbar";
import JsonLd from "../components/JsonLd";

export const metadata = {
  title: "Wayvo — Conversational Revenue OS para WhatsApp",
  description:
    "Plataforma operacional AI-first para WhatsApp: CRM conversacional, automação inteligente e revenue ops com copiloto de IA. Comece grátis.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "https://zapflow.vercel.app/",
    title: "Wayvo — Conversational Revenue OS para WhatsApp",
    description:
      "CRM conversacional, automação com IA e revenue ops numa só plataforma operacional.",
  },
};
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import HowItWorks from "../components/HowItWorks";
import BeforeAfter from "../components/BeforeAfter";
import Features from "../components/Features";
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
            { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "BRL" },
            { "@type": "Offer", name: "Pro", price: "0", priceCurrency: "BRL", description: "Sob consulta" },
          ],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "127",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "O Wayvo funciona com meu WhatsApp atual?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. Você conecta seu próprio número em 30 segundos via QR Code, sem trocar de chip nem usar app paralelo.",
              },
            },
            {
              "@type": "Question",
              name: "Existe plano gratuito?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. O plano Starter é gratuito pra sempre, sem cartão de crédito. O plano Pro tem preço personalizado conforme sua operação — clique em Consultar preço para receber uma proposta.",
              },
            },
            {
              "@type": "Question",
              name: "Posso fazer disparo em massa pelo WhatsApp?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. O Wayvo envia campanhas com mensagens personalizadas (nome, oferta, link) com cadência inteligente para manter seu número saudável.",
              },
            },
            {
              "@type": "Question",
              name: "Funciona pra clínicas, delivery, imobiliária e ótica?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. O Wayvo tem fluxos prontos para clínicas (agendamento), delivery (recorrência), imobiliárias (follow-up) e óticas (reativação).",
              },
            },
          ],
        }}
      />
      <Navbar />
      <Hero
        eyebrow="Conversational Revenue OS · AI-first"
        title="O sistema operacional da sua"
        highlight="operação de receita no WhatsApp"
        subtitle="Wayvo unifica CRM conversacional, automação inteligente e revenue ops — com um copiloto de IA que lê sua operação e recomenda a próxima ação, em tempo real."
        primaryCTA={{ label: "Começar agora", href: "/register" }}
        secondaryCTA={{ label: "Ver a plataforma", href: "#como-funciona" }}
        metrics={[
          { value: "AI-first", label: "copiloto operacional embutido" },
          { value: "Tempo real", label: "conversas, leads e receita" },
          { value: "Revenue Ops", label: "atribuição e ROI por campanha" },
          { value: "5 min", label: "para colocar em operação" },
        ]}
      />
      <Benefits
        title="Não é um disparador. É a infraestrutura de comunicação do seu negócio."
        subtitle="Uma plataforma operacional que transforma cada conversa em receita previsível."
        items={[
          { icon: "🧠", title: "Copiloto de IA operacional", desc: "A IA lê sua operação, prioriza leads quentes e recomenda a próxima ação — em todas as telas." },
          { icon: "💬", title: "CRM conversacional", desc: "Cada conversa com contexto comercial: score do lead, histórico, automações e receita atribuída." },
          { icon: "⚙️", title: "Automação que opera por você", desc: "Workflows visuais que qualificam, respondem e recuperam leads sem você tocar no celular." },
          { icon: "📊", title: "Revenue Ops de verdade", desc: "Atribuição de receita por campanha e fluxo. Saiba exatamente o que gera caixa." },
        ]}
      />
      <HowItWorks
        steps={[
          { title: "Conecte sua infraestrutura", desc: "Ligue seus canais em segundos — número próprio ou API oficial Meta. Sem chip novo, sem fricção." },
          { title: "Ative a operação", desc: "Use workflows prontos ou deixe a IA montar o fluxo. Campanhas, automações e CRM num só lugar." },
          { title: "Escale com inteligência", desc: "O copiloto monitora saúde, timing e receita — e te diz onde agir para crescer." },
        ]}
      />
      <BeforeAfter />
      <Features
        title="Uma plataforma operacional completa — não um conjunto de ferramentas soltas"
        items={[
          { icon: "🧠", title: "Wayvo AI Copilot", desc: "Insights priorizados, score de leads, melhor horário e alertas de saúde — gerados dos seus dados reais." },
          { icon: "🔀", title: "Workflow Builder", desc: "Editor visual de automações com IA que monta o fluxo. Qualificação, follow-up e recuperação no automático." },
          { icon: "📈", title: "Revenue analytics", desc: "Receita atribuída, ROI por campanha e funil real. Decisões com base em caixa, não em achismo." },
          { icon: "🛡️", title: "Engine de estabilidade", desc: "Balanceamento inteligente e distribuição operacional entre canais para entrega consistente." },
        ]}
      />
      <SocialProof
        stats={[
          { value: "+37", label: "vendas em 7 dias na média dos clientes" },
          { value: "3x", label: "mais faturamento no primeiro mês" },
          { value: "98%", label: "de taxa de entrega das mensagens" },
        ]}
        testimonials={[
          { name: "Marcelo S.", role: "Dono de ótica · Curitiba", result: "+R$ 11k em 5 dias", quote: "Coloquei o Wayvo numa terça. Na sexta já tinha 11 vendas que vieram só do WhatsApp. Pago a mensalidade no primeiro cliente.", color: "#00FFB2" },
          { name: "Camila R.", role: "Clínica de estética · Belo Horizonte", result: "Agenda 100% lotada", quote: "Minha agenda estava sempre com buracos. Hoje passo o dia atendendo. O sistema enche a agenda sozinho.", color: "#3B82F6" },
          { name: "Diego P.", role: "Hamburgueria · São Paulo", result: "Faturou 3x mais", quote: "Nos fins de semana fechados o sistema já bate o faturamento de uma terça inteira. Mudou meu jogo.", color: "#8B5CF6" },
        ]}
      />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </>
  );
}
