"use client";
import Topbar from "../../../components/dashboard/Topbar";

const FAQ = [
  { q: "Como conecto meu WhatsApp?", a: "Vá em Conexões e clique em Conectar WhatsApp. Escaneie o QR Code com o app no celular em Aparelhos conectados." },
  { q: "Quantos disparos posso fazer no plano gratuito?", a: "Até 3 disparos por mês. Faça upgrade para o Pro e tenha disparos ilimitados." },
  { q: "Como importar contatos de uma planilha?", a: "Em Leads, clique em Importar e envie um arquivo .xlsx ou .csv com colunas NOME e NUMERO." },
  { q: "Posso agendar um disparo?", a: "Sim, na tela de Disparos use o campo Agendar envio para escolher data/hora." },
  { q: "É seguro? Posso ser banido do WhatsApp?", a: "Use delays entre mensagens (3-10s) e pausas a cada 25 envios para reduzir o risco. Evite mensagens idênticas — use multi-mensagem em rotação." },
];

export default function SuportePage() {
  return (
    <>
      <Topbar title="Suporte" subtitle="Entre em contato com nossa equipe" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🆘</div>
          <h2 className="text-xl font-bold">Suporte Wayvo</h2>
          <p className="text-sm text-ink-300 mt-2 max-w-md mx-auto">
            Precisa de ajuda? Entre em contato pelo e-mail ou WhatsApp abaixo. Respondemos em até 24h úteis.
          </p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <a
              href="mailto:dias.sdt@gmail.com"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all text-left"
            >
              <div className="size-10 rounded-lg bg-accent-blue/15 flex items-center justify-center text-xl shrink-0">📧</div>
              <div>
                <div className="text-sm font-semibold">E-mail</div>
                <div className="text-xs text-primary">dias.sdt@gmail.com</div>
              </div>
            </a>
            <a
              href="https://wa.me/55?text=Olá! Preciso de suporte no Wayvo."
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all text-left"
            >
              <div className="size-10 rounded-lg bg-primary/15 flex items-center justify-center text-xl shrink-0">💬</div>
              <div>
                <div className="text-sm font-semibold">WhatsApp</div>
                <div className="text-xs text-primary">Abrir conversa</div>
              </div>
            </a>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-bg/40 border border-white/10 text-left text-xs text-ink-300 leading-relaxed max-w-md mx-auto">
            <strong className="text-ink-100">📖 Ao entrar em contato, informe:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Seu e-mail de cadastro</li>
              <li>• Descrição detalhada do problema</li>
              <li>• Capturas de tela se possível</li>
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
                  <span className="text-ink-500 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-ink-300 mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
