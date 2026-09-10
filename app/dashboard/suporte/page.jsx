"use client";
import { LifeBuoy, Mail, Info, BookOpen } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { DashHeaderIcon, DashBadge } from "../../../components/dashboard/DashUI";
import { SCREEN_ACCENT } from "../../../components/dashboard/dashTheme";

const ACCENT = SCREEN_ACCENT.suporte; // neutro — sem cor de acento

const FAQ = [
  { q: "Como conecto meu WhatsApp?", a: "Vá em Canais e clique em Conectar WhatsApp. Escaneie o QR Code com o app no celular em Aparelhos conectados." },
  { q: "Quantas campanhas posso fazer no plano gratuito?", a: "Até 3 campanhas por mês. Faça upgrade para o Pro e tenha campanhas ilimitadas." },
  { q: "Como importar contatos de uma planilha?", a: "Em Leads, clique em Importar e envie um arquivo .xlsx ou .csv com colunas NOME e NUMERO." },
  { q: "Posso agendar uma campanha?", a: "Sim, na tela de Campanhas use o campo Agendar envio para escolher data/hora." },
  { q: "É seguro? Posso ser banido do WhatsApp?", a: "Use delays entre mensagens (3-10s) e pausas a cada 25 envios para reduzir o risco. Evite mensagens idênticas — use múltiplas mensagens em rotação." },
  { q: "Como funciona o Workflow Builder?", a: "Em Workflow você cria fluxos automáticos com blocos visuais. Arraste blocos, conecte e publique — a IA cuida do resto." },
  { q: "Como integrar a API Oficial do WhatsApp (Meta)?", a: "Vá em Canal Oficial, siga o passo a passo para criar o app no Meta for Developers, insira suas credenciais e salve. O webhook é configurado automaticamente." },
];

export default function SuportePage() {
  return (
    <>
      <Topbar title="Suporte" subtitle="Entre em contato com nossa equipe" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">
        <div className="dash-card p-8 text-center">
          <div className="flex justify-center mb-4">
            <DashHeaderIcon icon={LifeBuoy} color={ACCENT} />
          </div>
          <h2 className="text-xl font-bold text-dash-ink">Suporte Wayvo</h2>
          <p className="text-sm text-dash-muted mt-2 max-w-md mx-auto">
            Precisa de ajuda? Entre em contato pelo e-mail ou WhatsApp abaixo. Respondemos em até 24h úteis.
          </p>
          <div className="mt-6 flex justify-center max-w-md mx-auto">
            <a
              href="mailto:suporte@wayvo.app.br"
              className="flex items-center gap-3 p-4 rounded-xl border border-dash-border bg-dash-subtle hover:border-dash-faint2 transition-all text-left w-full max-w-xs"
            >
              <div className="size-10 rounded-lg bg-white border border-dash-border flex items-center justify-center shrink-0">
                <Mail className="size-4 text-dash-muted" />
              </div>
              <div>
                <div className="text-sm font-semibold text-dash-ink">E-mail</div>
                <div className="text-xs text-dash-muted">suporte@wayvo.app.br</div>
              </div>
            </a>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-dash-subtle border border-dash-border text-left text-xs text-dash-muted leading-relaxed max-w-md mx-auto">
            <strong className="flex items-center gap-1.5 text-dash-ink">
              <Info className="size-3.5" /> Ao entrar em contato, informe:
            </strong>
            <ul className="mt-2 space-y-1">
              <li>• Seu e-mail de cadastro</li>
              <li>• Descrição detalhada do problema</li>
              <li>• Capturas de tela se possível</li>
            </ul>
          </div>
        </div>

        <div className="dash-card p-6">
          <h3 className="font-semibold text-dash-ink mb-4">Perguntas frequentes</h3>
          <div className="divide-y divide-dash-border2">
            {FAQ.map((f, i) => (
              <details key={i} className="py-3 group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-dash-ink list-none">
                  <span>{f.q}</span>
                  <span className="text-dash-faint group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-dash-muted mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="dash-card p-6 flex items-start gap-4 opacity-70">
          <div className="size-10 rounded-xl bg-dash-subtle border border-dash-border flex items-center justify-center shrink-0">
            <BookOpen className="size-4 text-dash-faint" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-dash-ink">Documentação</h3>
            <p className="text-xs text-dash-muted mt-1 leading-relaxed">
              Em breve — nossa base de conhecimento com tutoriais e guias de integração estará disponível aqui.
            </p>
            <div className="mt-3">
              <DashBadge color={ACCENT} dot={false}>Em construção</DashBadge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
