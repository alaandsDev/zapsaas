import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade",
  description: "Como a Wayvo coleta, usa e protege seus dados pessoais.",
  alternates: { canonical: "/privacidade" },
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
          Entrar →
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
          <p className="text-sm text-gray-500">Última atualização: {UPDATED} · Em conformidade com a LGPD (Lei nº 13.709/2018)</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8 text-sm text-gray-400 leading-relaxed">
          A Wayvo respeita sua privacidade e está comprometida com a proteção dos seus dados pessoais. Esta Política explica quais dados coletamos, como os utilizamos, por quanto tempo os retemos e quais são seus direitos como titular.
        </div>

        <Section num="1" title="Controlador dos Dados">
          <p>O controlador responsável pelo tratamento dos seus dados pessoais é a <strong className="text-gray-200">Wayvo Tecnologia Ltda.</strong></p>
          <p>Encarregado de Proteção de Dados (DPO): <a href={`mailto:${DPO}`} className="text-[#00FF88] hover:underline">{DPO}</a></p>
        </Section>

        <Section num="2" title="Dados que Coletamos">
          <p><strong className="text-gray-200">Dados de cadastro:</strong> nome, e-mail, número de telefone e senha (armazenada com hash bcrypt).</p>
          <p><strong className="text-gray-200">Dados de uso:</strong> logs de acesso, ações na plataforma, horários de uso, endereço IP.</p>
          <p><strong className="text-gray-200">Dados de integração:</strong> credenciais de API do WhatsApp/Meta fornecidas voluntariamente pelo usuário para ativar integrações.</p>
          <p><strong className="text-gray-200">Dados de leads:</strong> contatos importados ou cadastrados pelo usuário. A Wayvo age como <em>operadora</em> desses dados — o usuário é o controlador responsável pelo consentimento dos seus contatos.</p>
          <p><strong className="text-gray-200">Dados de pagamento:</strong> não armazenamos dados de cartão. O processamento é feito pela Stripe, que possui sua própria política de privacidade.</p>
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
                  ["Criar e gerenciar sua conta",          "Execução de contrato (art. 7º, V)"],
                  ["Prestar os serviços contratados",      "Execução de contrato (art. 7º, V)"],
                  ["Enviar e-mails transacionais",         "Execução de contrato (art. 7º, V)"],
                  ["Emitir cobranças e notas fiscais",     "Obrigação legal (art. 7º, II)"],
                  ["Melhorar a plataforma (analytics)",    "Legítimo interesse (art. 7º, IX)"],
                  ["Marketing próprio (novidades, planos)","Consentimento (art. 7º, I)"],
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
          <p>Não vendemos seus dados. Compartilhamos apenas com:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-gray-200">Supabase</strong> — banco de dados e autenticação (servidores na AWS us-east-1);</li>
            <li><strong className="text-gray-200">Stripe</strong> — processamento de pagamentos;</li>
            <li><strong className="text-gray-200">Resend</strong> — envio de e-mails transacionais;</li>
            <li><strong className="text-gray-200">Railway</strong> — hospedagem do backend;</li>
            <li><strong className="text-gray-200">Meta/WhatsApp</strong> — mediante integração habilitada pelo próprio usuário;</li>
            <li><strong className="text-gray-200">Autoridades públicas</strong> — quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p>Todos os parceiros são obrigados contratualmente a manter a confidencialidade dos dados.</p>
        </Section>

        <Section num="5" title="Retenção de Dados">
          <ul className="list-disc pl-5 space-y-1">
            <li>Dados de conta: mantidos enquanto a conta estiver ativa + 5 anos após o encerramento (obrigação fiscal);</li>
            <li>Logs de acesso: 6 meses (Marco Civil da Internet);</li>
            <li>Dados de leads importados: excluídos conforme solicitação do usuário ou em até 90 dias após o cancelamento da conta;</li>
            <li>Dados de pagamento (registros): 5 anos (obrigação tributária).</li>
          </ul>
        </Section>

        <Section num="6" title="Segurança">
          <p>Adotamos as seguintes medidas técnicas e organizacionais:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Senhas armazenadas com bcrypt (fator de custo 12);</li>
            <li>Comunicação criptografada via HTTPS/TLS 1.3;</li>
            <li>Row-Level Security (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados;</li>
            <li>Tokens de sessão com expiração e revogação;</li>
            <li>Acesso ao banco restrito a IPs autorizados.</li>
          </ul>
        </Section>

        <Section num="7" title="Seus Direitos (LGPD — art. 18)">
          <p>Como titular de dados, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-gray-200">Confirmação</strong> de que tratamos seus dados;</li>
            <li><strong className="text-gray-200">Acesso</strong> aos dados que mantemos sobre você;</li>
            <li><strong className="text-gray-200">Correção</strong> de dados incompletos, inexatos ou desatualizados;</li>
            <li><strong className="text-gray-200">Portabilidade</strong> dos seus dados em formato estruturado;</li>
            <li><strong className="text-gray-200">Eliminação</strong> dos dados desnecessários ou tratados em desconformidade;</li>
            <li><strong className="text-gray-200">Revogação do consentimento</strong> a qualquer momento;</li>
            <li><strong className="text-gray-200">Oposição</strong> a tratamentos baseados em legítimo interesse.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato: <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a>. Respondemos em até 15 dias úteis.</p>
        </Section>

        <Section num="8" title="Cookies">
          <p>Utilizamos apenas cookies estritamente necessários para manter sua sessão autenticada. Não utilizamos cookies de rastreamento de terceiros ou publicidade.</p>
        </Section>

        <Section num="9" title="Transferência Internacional">
          <p>Alguns dados são processados em servidores fora do Brasil (EUA — AWS us-east-1, Railway). Essas transferências são realizadas com garantias adequadas de proteção conforme art. 33 da LGPD.</p>
        </Section>

        <Section num="10" title="Alterações">
          <p>Esta Política pode ser atualizada. Alterações significativas serão comunicadas por e-mail com 15 dias de antecedência. A versão vigente está sempre disponível nesta página.</p>
        </Section>

        <Section num="11" title="Contato e DPO">
          <p>Dúvidas sobre privacidade: <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a></p>
          <p>Encarregado de Dados (DPO): <a href={`mailto:${DPO}`} className="text-[#00FF88] hover:underline">{DPO}</a></p>
          <p>Você também pode registrar reclamações junto à ANPD (Autoridade Nacional de Proteção de Dados): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-[#00FF88] hover:underline">gov.br/anpd</a></p>
        </Section>

        <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm">
          <Link href="/termos" className="text-[#00FF88] hover:underline">Termos de Uso</Link>
          <Link href="/login" className="text-gray-500 hover:text-gray-300">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
