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
    date: "2026-09-14",
    version: "v1.26",
    badge: "Feature",
    badgeColor: "primary",
    title: "Meta API com agendamento + Leads sem duplicatas + Login robusto",
    items: [
      "Campanhas via API Meta (templates) agendadas pelo cron com canal cloud_template",
      "Histórico de disparos de templates visível na aba API Meta",
      "Variáveis do template mapeadas por coluna na importação",
      "Sync de listas remove duplicatas automaticamente antes de importar",
      "Botão 'Sincronizar' travado até recarregar — sem cliques extras criando duplicatas",
      "Login com retry automático na sessão + erro de banco separado de senha errada",
      "Status do token carrega automaticamente ao abrir Canal Oficial",
    ],
  },
  {
    date: "2026-09-10",
    version: "v1.25",
    badge: "UX",
    badgeColor: "blue",
    title: "Tema light completo + Canal Oficial simplificado (só Meta)",
    items: [
      "Tema light em todo o dashboard: telas internas, landing, auth e home",
      "Canal Oficial migrado para aba única API Meta Direta (YCloud removido)",
      "Cancelamento de disparo funcionando no bulk WhatsApp e Cloud API",
      "Bugs de Supabase PromiseLike corrigidos no log de templates e sync",
    ],
  },
  {
    date: "2026-08-17",
    version: "v1.24",
    badge: "Feature",
    badgeColor: "purple",
    title: "Agente de IA treinável (exclusivo Pro) + Landing repaginada",
    items: [
      "Agente de IA: treine com perguntas e respostas do seu negócio (plano Pro)",
      "Pricing reestruturado: Starter com trial 7 dias + Pro com Agente incluso",
      "Landing com moldura de celular real, carrossel de parceiros e seções claras",
      "Seção 'Como funciona' com foto maior e trilha visual em degraus",
      "3 novos blocos visuais na landing + copy em português direto",
    ],
  },
  {
    date: "2026-06-10",
    version: "v1.23",
    badge: "Feature",
    badgeColor: "purple",
    title: "SMS via Comtele + Login Google + fixes mobile",
    items: [
      "SMS via Comtele: importa contatos de listas salvas diretamente",
      "Créditos SMS em 2 baldes: base mensal (reset) + avulso (nunca expira)",
      "Login e cadastro com Google em 1 clique (Google Identity Services)",
      "Blog com 4 novos artigos SEO e imagens reais (Pexels)",
      "Envio de mídia (imagem, áudio, arquivo) pelo Canal Oficial",
      "Correções mobile: Leads, painel de segmentos e drawer lateral",
    ],
  },
  {
    date: "2026-06-08",
    version: "v1.22",
    badge: "Feature",
    badgeColor: "purple",
    title: "Canal Oficial bidirecional + Embedded Signup YCloud",
    items: [
      "Resposta ao cliente sai pelo Canal Oficial (fluxo 100% bidirecional)",
      "Respostas de botão interativo reconhecidas e roteadas corretamente",
      "Embedded Signup: ativa o número oficial com 1 clique, sem sair do Wayvo",
      "Multi-número oficial com roteamento inteligente entre números",
    ],
  },
  {
    date: "2026-06-06",
    version: "v1.21",
    badge: "Fix",
    badgeColor: "yellow",
    title: "Métricas corretas + fim de emails duplicados",
    items: [
      "Card 'Mensagens Enviadas' corrigido — antes contava só campanhas",
      "Evita email duplicado de campanha já concluída ao reconectar",
      "Estimativa de custo removida do Canal Oficial (interface mais limpa)",
    ],
  },
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
