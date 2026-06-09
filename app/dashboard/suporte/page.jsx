"use client";
import Topbar from "../../../components/dashboard/Topbar";

const FAQ = [
  { q: "Como conecto meu WhatsApp?", a: "VÃ¡ em Canais e clique em Conectar WhatsApp. Escaneie o QR Code com o app no celular em Aparelhos conectados." },
  { q: "Quantas campanhas posso fazer no plano gratuito?", a: "AtÃ© 3 campanhas por mÃªs. FaÃ§a upgrade para o Pro e tenha campanhas ilimitadas." },
  { q: "Como importar contatos de uma planilha?", a: "Em Leads, clique em Importar e envie um arquivo .xlsx ou .csv com colunas NOME e NUMERO." },
  { q: "Posso agendar uma campanha?", a: "Sim, na tela de Campanhas use o campo Agendar envio para escolher data/hora." },
  { q: "Ã‰ seguro? Posso ser banido do WhatsApp?", a: "Use delays entre mensagens (3-10s) e pausas a cada 25 envios para reduzir o risco. Evite mensagens idÃªnticas â€” use mÃºltiplas mensagens em rotaÃ§Ã£o." },
  { q: "Como funciona o Workflow Builder?", a: "Em Workflow vocÃª cria fluxos automÃ¡ticos com blocos visuais. Arraste blocos, conecte e publique â€” a IA cuida do resto." },
  { q: "Como integrar a API Oficial do WhatsApp (Meta)?", a: "VÃ¡ em Canal Oficial, siga o passo a passo para criar o app no Meta for Developers, insira suas credenciais e salve. O webhook Ã© configurado automaticamente." },
];

export default function SuportePage() {
  return (
    <>
      <Topbar title="Suporte" subtitle="Entre em contato com nossa equipe" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">ðŸ†˜</div>
          <h2 className="text-xl font-bold">Suporte Wayvo</h2>
          <p className="text-sm text-ink-300 mt-2 max-w-md mx-auto">
            Precisa de ajuda? Entre em contato pelo e-mail ou WhatsApp abaixo. Respondemos em atÃ© 24h Ãºteis.
          </p>
          <div className="mt-6 flex justify-center max-w-md mx-auto">
            <a
              href="mailto:suporte@wayvo.app.br"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all text-left w-full max-w-xs"
            >
              <div className="size-10 rounded-lg bg-accent-blue/15 flex items-center justify-center text-xl shrink-0">ðŸ“§</div>
              <div>
                <div className="text-sm font-semibold">E-mail</div>
                <div className="text-xs text-primary">suporte@wayvo.app.br</div>
              </div>
            </a>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-bg/40 border border-white/10 text-left text-xs text-ink-300 leading-relaxed max-w-md mx-auto">
            <strong className="text-ink-100">ðŸ“– Ao entrar em contato, informe:</strong>
            <ul className="mt-2 space-y-1">
              <li>â€¢ Seu e-mail de cadastro</li>
              <li>â€¢ DescriÃ§Ã£o detalhada do problema</li>
              <li>â€¢ Capturas de tela se possÃ­vel</li>
            </ul>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Perguntas frequentes</h3>
          <div className="divide-y divide-white/[0.06]">
            {FAQ.map((f, i) => (
              <details key={i} className="py-3 group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium list-none">
                  <span>{f.q}</span>
                  <span className="text-ink-500 group-open:rotate-180 transition-transform">â–¾</span>
                </summary>
                <p className="text-sm text-ink-400 mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4 opacity-60">
          <div className="size-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 text-xl">ðŸ“š</div>
          <div>
            <h3 className="font-semibold text-sm">DocumentaÃ§Ã£o</h3>
            <p className="text-xs text-ink-400 mt-1 leading-relaxed">
              Em breve â€” nossa base de conhecimento com tutoriais e guias de integraÃ§Ã£o estarÃ¡ disponÃ­vel aqui.
            </p>
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-ink-500 cursor-not-allowed select-none">
              Em construÃ§Ã£o ðŸš§
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
