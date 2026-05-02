import NicheLanding from "../../components/NicheLanding";
import JsonLd from "../../components/JsonLd";

const URL = "https://zapflow.vercel.app/clinicas";

export const metadata = {
  title: "ZapFlow para Clínicas — Encha sua agenda automaticamente",
  description:
    "Sistema de vendas automáticas pelo WhatsApp para clínicas. Agendamento automático, confirmação de consulta, redução de faltas e reativação de pacientes.",
  keywords: [
    "whatsapp para clínicas",
    "agendamento automático whatsapp",
    "confirmação de consulta whatsapp",
    "reativação de pacientes",
    "redução de faltas clínica",
    "marketing para clínicas",
    "crm para clínicas",
  ],
  alternates: { canonical: "/clinicas" },
  openGraph: {
    url: URL,
    title: "ZapFlow para Clínicas — Agenda cheia no automático",
    description:
      "Agendamento, confirmação e reativação de pacientes pelo WhatsApp. Faltas até 70% menores.",
  },
};

const BREADCRUMB = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://zapflow.vercel.app/" },
    { "@type": "ListItem", position: 2, name: "Clínicas", item: URL },
  ],
};

export default function Page() {
  return (
    <>
    <JsonLd data={BREADCRUMB} />
    <NicheLanding
      eyebrow="ZapFlow para Clínicas"
      heroTitle="Encha sua agenda automaticamente com"
      heroHighlight="pacientes todos os dias"
      heroSubtitle="Sua secretária não precisa mais correr atrás de paciente. O ZapFlow agenda, confirma e reativa por você — e sua agenda vive cheia, mesmo nos dias fracos."
      ctaLabel="Quero encher minha agenda"
      benefitsTitle="Agenda cheia. Faltas reduzidas. Faturamento previsível."
      benefits={[
        { icon: "📅", title: "Agendamento automático", desc: "Paciente recebe a mensagem, escolhe o horário e a agenda é preenchida sozinha. Sem ligação, sem fila no telefone." },
        { icon: "✅", title: "Confirmação e redução de faltas", desc: "Lembrete automático antes da consulta. Faltas caem em até 70% — cada horário vira receita." },
        { icon: "🔄", title: "Reativação de pacientes inativos", desc: "Quem não voltou nos últimos 6 meses recebe a mensagem certa e volta a marcar. Recorrência no automático." },
        { icon: "💼", title: "Pré-venda de procedimentos", desc: "Avalie interesse em procedimentos novos, gere lista de espera e venda pacotes antes mesmo de divulgar." },
      ]}
      steps={[
        { title: "Conecte o WhatsApp da clínica", desc: "Em 30 segundos. Sem trocar de número, sem app paralelo. Tudo no número que seus pacientes já conhecem." },
        { title: "Importe sua base de pacientes", desc: "ZapFlow organiza, segmenta e prepara as campanhas certas pra cada perfil de paciente." },
        { title: "Ative o sistema e relaxe", desc: "Confirmações, lembretes e reativações rodam sozinhos. Você só acompanha a agenda enchendo." },
      ]}
      stats={[
        { value: "70%", label: "menos faltas com confirmação automática" },
        { value: "+40%", label: "de aumento médio na agenda mensal" },
        { value: "24h", label: "agendando enquanto você atende" },
      ]}
      testimonials={[
        { name: "Dra. Camila R.", role: "Clínica de Estética · Belo Horizonte", quote: "Antes do ZapFlow tinha 6 horários por dia ocupados. Hoje fecho a semana com agenda lotada e lista de espera.", color: "#00FFB2" },
        { name: "Dr. André T.", role: "Odontologia · Recife", quote: "Reativei 380 pacientes parados em 2 semanas. Agendamento explodiu, faltas despencaram. Mudei meu negócio.", color: "#3B82F6" },
        { name: "Dra. Renata M.", role: "Fisioterapia · Florianópolis", quote: "Minha secretária ganhou 4 horas do dia de volta. E a agenda? Mais cheia do que nunca.", color: "#8B5CF6" },
      ]}
      finalCTA={{
        title: "Cada horário vazio é dinheiro indo embora",
        subtitle: "Sua agenda pode estar lotada todos os dias — sem ligação, sem stress. Ative o ZapFlow e veja a diferença em 7 dias.",
      }}
    />
    </>
  );
}
