import Link from "next/link";

export const metadata = {
  title: "PolÃ­tica de Privacidade â€” Wayvo",
  description: "Como a Wayvo coleta, usa e protege seus dados pessoais.",
};

const UPDATED = "23 de maio de 2025";
const EMAIL   = "privacidade@wayvo.app.br";
const DPO     = "dpo@wayvo.app.br";

function Section({ num, title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3">
        {num}. {title}
      </h2>
      <div className="text-[15px] text-gray-400 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-300">
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold" style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Wayvo
        </Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Entrar â†’
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">PolÃ­tica de Privacidade</h1>
          <p className="text-sm text-gray-500">Ãšltima atualizaÃ§Ã£o: {UPDATED} Â· Em conformidade com a LGPD (Lei nÂº 13.709/2018)</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8 text-sm text-gray-400 leading-relaxed">
          A Wayvo respeita sua privacidade e estÃ¡ comprometida com a proteÃ§Ã£o dos seus dados pessoais. Esta PolÃ­tica explica quais dados coletamos, como os utilizamos, por quanto tempo os retemos e quais sÃ£o seus direitos como titular.
        </div>

        <Section num="1" title="Controlador dos Dados">
          <p>O controlador responsÃ¡vel pelo tratamento dos seus dados pessoais Ã© a <strong className="text-gray-200">Wayvo Tecnologia Ltda.</strong></p>
          <p>Encarregado de ProteÃ§Ã£o de Dados (DPO): <a href={`mailto:${DPO}`} className="text-[#00FF88] hover:underline">{DPO}</a></p>
        </Section>

        <Section num="2" title="Dados que Coletamos">
          <p><strong className="text-gray-200">Dados de cadastro:</strong> nome, e-mail, nÃºmero de telefone e senha (armazenada com hash bcrypt).</p>
          <p><strong className="text-gray-200">Dados de uso:</strong> logs de acesso, aÃ§Ãµes na plataforma, horÃ¡rios de uso, endereÃ§o IP.</p>
          <p><strong className="text-gray-200">Dados de integraÃ§Ã£o:</strong> credenciais de API do WhatsApp/Meta fornecidas voluntariamente pelo usuÃ¡rio para ativar integraÃ§Ãµes.</p>
          <p><strong className="text-gray-200">Dados de leads:</strong> contatos importados ou cadastrados pelo usuÃ¡rio. A Wayvo age como <em>operadora</em> desses dados â€” o usuÃ¡rio Ã© o controlador responsÃ¡vel pelo consentimento dos seus contatos.</p>
          <p><strong className="text-gray-200">Dados de pagamento:</strong> nÃ£o armazenamos dados de cartÃ£o. O processamento Ã© feito pela Stripe, que possui sua prÃ³pria polÃ­tica de privacidade.</p>
        </Section>

        <Section num="3" title="Finalidade e Base Legal">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Finalidade</th>
                  <th className="text-left py-2 text-gray-300 font-semibold">Base legal (LGPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {[
                  ["Criar e gerenciar sua conta",          "ExecuÃ§Ã£o de contrato (art. 7Âº, V)"],
                  ["Prestar os serviÃ§os contratados",      "ExecuÃ§Ã£o de contrato (art. 7Âº, V)"],
                  ["Enviar e-mails transacionais",         "ExecuÃ§Ã£o de contrato (art. 7Âº, V)"],
                  ["Emitir cobranÃ§as e notas fiscais",     "ObrigaÃ§Ã£o legal (art. 7Âº, II)"],
                  ["Melhorar a plataforma (analytics)",    "LegÃ­timo interesse (art. 7Âº, IX)"],
                  ["Marketing prÃ³prio (novidades, planos)","Consentimento (art. 7Âº, I)"],
                ].map(([fin, base]) => (
                  <tr key={fin}>
                    <td className="py-2 pr-4 text-gray-400">{fin}</td>
                    <td className="py-2 text-gray-400">{base}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section num="4" title="Compartilhamento de Dados">
          <p>NÃ£o vendemos seus dados. Compartilhamos apenas com:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-gray-200">Supabase</strong> â€” banco de dados e autenticaÃ§Ã£o (servidores na AWS us-east-1);</li>
            <li><strong className="text-gray-200">Stripe</strong> â€” processamento de pagamentos;</li>
            <li><strong className="text-gray-200">Resend</strong> â€” envio de e-mails transacionais;</li>
            <li><strong className="text-gray-200">Railway</strong> â€” hospedagem do backend;</li>
            <li><strong className="text-gray-200">Meta/WhatsApp</strong> â€” mediante integraÃ§Ã£o habilitada pelo prÃ³prio usuÃ¡rio;</li>
            <li><strong className="text-gray-200">Autoridades pÃºblicas</strong> â€” quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p>Todos os parceiros sÃ£o obrigados contratualmente a manter a confidencialidade dos dados.</p>
        </Section>

        <Section num="5" title="RetenÃ§Ã£o de Dados">
          <ul className="list-disc pl-5 space-y-1">
            <li>Dados de conta: mantidos enquanto a conta estiver ativa + 5 anos apÃ³s o encerramento (obrigaÃ§Ã£o fiscal);</li>
            <li>Logs de acesso: 6 meses (Marco Civil da Internet);</li>
            <li>Dados de leads importados: excluÃ­dos conforme solicitaÃ§Ã£o do usuÃ¡rio ou em atÃ© 90 dias apÃ³s o cancelamento da conta;</li>
            <li>Dados de pagamento (registros): 5 anos (obrigaÃ§Ã£o tributÃ¡ria).</li>
          </ul>
        </Section>

        <Section num="6" title="SeguranÃ§a">
          <p>Adotamos as seguintes medidas tÃ©cnicas e organizacionais:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Senhas armazenadas com bcrypt (fator de custo 12);</li>
            <li>ComunicaÃ§Ã£o criptografada via HTTPS/TLS 1.3;</li>
            <li>Row-Level Security (RLS) no banco de dados â€” cada usuÃ¡rio acessa apenas seus prÃ³prios dados;</li>
            <li>Tokens de sessÃ£o com expiraÃ§Ã£o e revogaÃ§Ã£o;</li>
            <li>Acesso ao banco restrito a IPs autorizados.</li>
          </ul>
        </Section>

        <Section num="7" title="Seus Direitos (LGPD â€” art. 18)">
          <p>Como titular de dados, vocÃª tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-gray-200">ConfirmaÃ§Ã£o</strong> de que tratamos seus dados;</li>
            <li><strong className="text-gray-200">Acesso</strong> aos dados que mantemos sobre vocÃª;</li>
            <li><strong className="text-gray-200">CorreÃ§Ã£o</strong> de dados incompletos, inexatos ou desatualizados;</li>
            <li><strong className="text-gray-200">Portabilidade</strong> dos seus dados em formato estruturado;</li>
            <li><strong className="text-gray-200">EliminaÃ§Ã£o</strong> dos dados desnecessÃ¡rios ou tratados em desconformidade;</li>
            <li><strong className="text-gray-200">RevogaÃ§Ã£o do consentimento</strong> a qualquer momento;</li>
            <li><strong className="text-gray-200">OposiÃ§Ã£o</strong> a tratamentos baseados em legÃ­timo interesse.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato: <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a>. Respondemos em atÃ© 15 dias Ãºteis.</p>
        </Section>

        <Section num="8" title="Cookies">
          <p>Utilizamos apenas cookies estritamente necessÃ¡rios para manter sua sessÃ£o autenticada. NÃ£o utilizamos cookies de rastreamento de terceiros ou publicidade.</p>
        </Section>

        <Section num="9" title="TransferÃªncia Internacional">
          <p>Alguns dados sÃ£o processados em servidores fora do Brasil (EUA â€” AWS us-east-1, Railway). Essas transferÃªncias sÃ£o realizadas com garantias adequadas de proteÃ§Ã£o conforme art. 33 da LGPD.</p>
        </Section>

        <Section num="10" title="AlteraÃ§Ãµes">
          <p>Esta PolÃ­tica pode ser atualizada. AlteraÃ§Ãµes significativas serÃ£o comunicadas por e-mail com 15 dias de antecedÃªncia. A versÃ£o vigente estÃ¡ sempre disponÃ­vel nesta pÃ¡gina.</p>
        </Section>

        <Section num="11" title="Contato e DPO">
          <p>DÃºvidas sobre privacidade: <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a></p>
          <p>Encarregado de Dados (DPO): <a href={`mailto:${DPO}`} className="text-[#00FF88] hover:underline">{DPO}</a></p>
          <p>VocÃª tambÃ©m pode registrar reclamaÃ§Ãµes junto Ã  ANPD (Autoridade Nacional de ProteÃ§Ã£o de Dados): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-[#00FF88] hover:underline">gov.br/anpd</a></p>
        </Section>

        <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm">
          <Link href="/termos" className="text-[#00FF88] hover:underline">Termos de Uso</Link>
          <Link href="/login" className="text-gray-500 hover:text-gray-300">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
