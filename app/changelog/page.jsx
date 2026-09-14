import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Changelog — Novidades do Wayvo",
  description: "Acompanhe as últimas atualizações, melhorias e novas funcionalidades do Wayvo.",
  alternates: { canonical: "/changelog" },
};

const RELEASES = [
  {
    date: "2026-05-09",
    version: "v1.18",
    badge: "Premium",
    badgeColor: "primary",
    title: "Visual high-ticket: comparativo de planos, garantia 7 dias, antes vs depois",
    items: [
      "Tabela comparativa Free vs Pro com 13 features lado a lado",
      "Selo de garantia de 7 dias no pricing — risk reversal",
      "Seção 'Antes vs Depois' mostra a diferença gritante",
      "Live counter na hero ('27 negócios ativaram disparos hoje')",
      "Toast notifications globais com progress bar e animações",
      "CTA flutuante ao scroll na landing",
      "Footer com newsletter e status do sistema",
    ],
  },
  {
    date: "2026-05-08",
    version: "v1.17",
    badge: "UX",
    badgeColor: "blue",
    title: "Polish — empty states ricos, skeleton loaders e FAQ",
    items: [
      "Empty states com glow, CTAs grandes e dicas",
      "Skeleton loaders em listas e dashboard (sensação de produto rápido)",
      "FAQ acordeão com 8 perguntas focadas em objeções",
      "Testimonials com badge de resultado concreto (R$, agenda lotada, etc)",
      "Foto de perfil + nome salvo do contato em conversas",
      "Self-chat e mensagens fantasma filtrados",
    ],
  },
  {
    date: "2026-05-07",
    version: "v1.16",
    badge: "Feature",
    badgeColor: "purple",
    title: "Conversas em tempo real (estilo WhatsApp Web)",
    items: [
      "Chat com lista de conversas + thread ativo, espelhando WhatsApp Web",
      "Tabs por número conectado (multi-WPP)",
      "Real-time via Server-Sent Events — mensagens chegam em ~50ms",
      "Mídia funcional: áudios tocam inline, fotos/vídeos preview, documentos baixáveis",
      "Status de conexão atualiza instantâneo após scan do QR",
    ],
  },
  {
    date: "2026-05-06",
    version: "v1.15",
    badge: "Feature",
    badgeColor: "purple",
    title: "Disparos: relatório detalhado + export Excel",
    items: [
      "Cards do histórico de disparos clicáveis abrem relatório completo",
      "Tabela com cada contato: nome, número, status, hora, erro",
      "Filtros: todos / enviados / falhas / pendentes",
      "Export para Excel com 2 sheets (Resumo + Contatos)",
    ],
  },
  {
    date: "2026-05-05",
    version: "v1.14",
    badge: "Fix",
    badgeColor: "yellow",
    title: "Fim das mensagens duplicadas + UI da sidebar premium",
    items: [
      "Removido retry+ack-wait que causava entrega duplicada quando o ACK demorava",
      "Sidebar estilo Linear/Notion: hover expande sem deslocar conteúdo",
      "Botão de pin pra fixar sidebar aberta (preferência salva)",
      "Foto de perfil + nome real do contato em vez de inicial colorida",
    ],
  },
  {
    date: "2026-05-03",
    version: "v1.12",
    badge: "Feature",
    badgeColor: "purple",
    title: "Automação Inteligente (workflow builder visual)",
    items: [
      "Editor drag-and-drop com React Flow — monte fluxos visuais",
      "5 tipos de bloco: Gatilho, Mensagem, Espera, Condição, Ação",
      "Persistência completa de fluxos via API",
      "Sidebar de blocos arrastáveis + painel de configuração lateral",
    ],
  },
  {
    date: "2026-05-02",
    version: "v1.10",
    badge: "Feature",
    badgeColor: "purple",
    title: "SMS via Zenvia + Marketing pro admin",
    items: [
      "Disparo de SMS com créditos pré-pagos via Stripe",
      "Pacotes: 500 SMS por R$ 50 / 1.000 SMS por R$ 75",
      "Cobrança por segmento (160 chars GSM-7 / 70 Unicode)",
      "Admin: campanhas em massa pra usuários por plano/vencimento/devedores",
    ],
  },
  {
    date: "2026-04-30",
    version: "v1.8",
    badge: "Feature",
    badgeColor: "purple",
    title: "WhatsApp Cloud API (Meta direto) + Round-robin anti-ban",
    items: [
      "Integração oficial com WhatsApp Cloud API da Meta",
      "Multi-tenant: cada user tem suas próprias credenciais",
      "2 conexões WhatsApp simultâneas com round-robin (1 msg por chip)",
      "SEO completo: sitemap, robots, JSON-LD em todas as landings",
    ],
  },
];

const BADGE_COLORS = {
  primary: "bg-[#0E8A4714] text-[#0E8A47] border-[#0E8A4733]",
  blue:    "bg-[#2F80ED14] text-[#2F80ED] border-[#2F80ED33]",
  purple:  "bg-[#6D3BEA14] text-[#6D3BEA] border-[#6D3BEA33]",
  yellow:  "bg-[#C2740A14] text-[#C2740A] border-[#C2740A33]",
};

export default function Changelog() {
  return (
    <>
      <Navbar />
      <main className="container-x pt-28 pb-20" style={{ background: "#EDEFF3", minHeight: "100vh" }}>
        <header className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E8A4714] border border-[#0E8A4733] text-xs font-semibold text-[#0E8A47] mb-5">
            <span className="size-1.5 rounded-full bg-[#0E8A47] animate-pulse" />
            Atualizado constantemente
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#0A1020]">
            O que <span className="gradient-text">há de novo</span>
          </h1>
          <p className="mt-5 text-lg text-[#5A6474]">
            Cada versão traz melhorias diretas no seu painel. Sem cobrança extra.
          </p>
        </header>

        <div className="max-w-3xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-[#0E8A47] via-[#0E8A4740] to-transparent" />

          <div className="space-y-10">
            {RELEASES.map((rel, i) => (
              <article key={i} className="relative pl-12">
                {/* Dot */}
                <div className={`absolute left-0 top-1 size-8 rounded-full border-2 flex items-center justify-center ${
                  i === 0 ? "bg-[#0E8A47] border-[#0E8A47] text-white" : "bg-white border-[#E9ECF1]"
                }`}>
                  {i === 0 ? "✓" : <span className="size-2 rounded-full bg-[#CBD5E1]" />}
                </div>

                <div className="rounded-2xl border border-[#E9ECF1] bg-white p-6 hover:border-[#0E8A4740] transition-colors shadow-[0_1px_2px_rgba(10,16,32,0.04)]">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#8A94A6]">{rel.version}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${BADGE_COLORS[rel.badgeColor]}`}>
                        {rel.badge}
                      </span>
                    </div>
                    <time className="text-xs text-[#98A1B0]">
                      {new Date(rel.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </time>
                  </div>

                  <h2 className="text-xl font-bold mb-4 text-[#0A1020]">{rel.title}</h2>

                  <ul className="space-y-2">
                    {rel.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-[#5A6474]">
                        <span className="text-[#0E8A47] mt-0.5 shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-[#8A94A6] mb-4">Pronto pra começar?</p>
          <Link href="/register" className="btn-primary inline-flex">
            Criar conta grátis →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
