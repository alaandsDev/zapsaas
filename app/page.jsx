import Navbar from "../components/Navbar";
import JsonLd from "../components/JsonLd";

export const metadata = {
  title: "ZapFlow — Sistema de Vendas Automáticas pelo WhatsApp 24h",
  description:
    "Transforme seu WhatsApp em uma máquina de vendas automática. Disparos em massa, chatbot 24/7 e automações. Plano grátis pra começar hoje.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "https://zapflow.vercel.app/",
    title: "ZapFlow — Vendas Automáticas pelo WhatsApp 24h",
    description:
      "Disparos em massa, chatbot e automações. Venda todos os dias no automático.",
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
          name: "ZapFlow",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Sistema de vendas automáticas pelo WhatsApp: disparos em massa, chatbot 24/7, automações e CRM.",
          offers: [
            { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "BRL" },
            { "@type": "Offer", name: "Pro", price: "47", priceCurrency: "BRL" },
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
              name: "O ZapFlow funciona com meu WhatsApp atual?",
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
                text: "Sim. O plano Starter é gratuito pra sempre, sem cartão de crédito. O plano Pro custa R$ 47/mês.",
              },
            },
            {
              "@type": "Question",
              name: "Posso fazer disparo em massa pelo WhatsApp?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. O ZapFlow envia campanhas com mensagens personalizadas (nome, oferta, link) com cadência inteligente para manter seu número saudável.",
              },
            },
            {
              "@type": "Question",
              name: "Funciona pra clínicas, delivery, imobiliária e ótica?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sim. O ZapFlow tem fluxos prontos para clínicas (agendamento), delivery (recorrência), imobiliárias (follow-up) e óticas (reativação).",
              },
            },
          ],
        }}
      />
      <Navbar />
      <Hero
        title="Transforme seu WhatsApp em uma"
        highlight="máquina de vendas automática"
        subtitle="Venda todos os dias, responda clientes na hora e nunca mais perca uma oportunidade. O ZapFlow trabalha por você 24 horas por dia — enquanto você cuida do que importa."
        metrics={[
          { value: "+37", label: "vendas em 7 dias (média)" },
          { value: "24h", label: "vendendo no automático" },
          { value: "5min", label: "para ativar" },
          { value: "0", label: "linhas de código" },
        ]}
      />
      <Benefits
        title="Negócios que ativam o ZapFlow vendem mais — todo santo dia"
        subtitle="Não é ferramenta. É um sistema completo pronto pra colocar dinheiro no seu caixa."
        items={[
          { icon: "💰", title: "Venda todos os dias no automático", desc: "Seu WhatsApp passa a faturar mesmo quando você está dormindo, no almoço ou de folga." },
          { icon: "🎯", title: "Nunca perca um cliente", desc: "Cada lead recebe a mensagem certa no momento certo. Sem cliente esquecido, sem dinheiro na mesa." },
          { icon: "📈", title: "Fale com centenas de contatos", desc: "Reative sua base, traga clientes antigos de volta e converta lista parada em venda real." },
          { icon: "🚀", title: "Aumente seu faturamento", desc: "Mais conversas = mais vendas. Donos de negócio reportam até 3x mais faturamento no primeiro mês." },
        ]}
      />
      <HowItWorks
        steps={[
          { title: "Conecte seu WhatsApp", desc: "Em 30 segundos você liga seu número ao ZapFlow. Sem chip novo, sem app paralelo." },
          { title: "Ative o sistema", desc: "Escolha um template pronto ou personalize a mensagem. Tudo direto no painel, sem código." },
          { title: "Comece a vender", desc: "O sistema dispara, organiza e responde. Você só acompanha as vendas chegando." },
        ]}
      />
      <BeforeAfter />
      <Features
        title="Tudo que você precisa pra vender mais — em um único lugar"
        items={[
          { icon: "⚡", title: "Disparos personalizados", desc: "Mensagens com nome, oferta e link. Cada cliente sente que recebeu uma mensagem só pra ele." },
          { icon: "📊", title: "Relatórios em tempo real", desc: "Acompanhe entregas, respostas e conversões direto no painel. Saiba exatamente o que está dando dinheiro." },
          { icon: "🗂️", title: "Listas inteligentes", desc: "Importe, segmente e organize seus contatos. Mande a mensagem certa pra pessoa certa." },
          { icon: "🛡️", title: "Conta protegida", desc: "Cadência otimizada, intervalos inteligentes e boas práticas pra manter seu número saudável." },
        ]}
      />
      <SocialProof
        stats={[
          { value: "+37", label: "vendas em 7 dias na média dos clientes" },
          { value: "3x", label: "mais faturamento no primeiro mês" },
          { value: "98%", label: "de taxa de entrega das mensagens" },
        ]}
        testimonials={[
          { name: "Marcelo S.", role: "Dono de ótica · Curitiba", result: "+R$ 11k em 5 dias", quote: "Coloquei o ZapFlow numa terça. Na sexta já tinha 11 vendas que vieram só do WhatsApp. Pago a mensalidade no primeiro cliente.", color: "#00FFB2" },
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
