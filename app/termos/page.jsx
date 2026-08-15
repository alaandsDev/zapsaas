import Link from "next/link";

export const metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso da plataforma Wayvo.",
  alternates: { canonical: "/termos" },
};

const UPDATED = "23 de maio de 2025";
const COMPANY = "Wayvo Tecnologia Ltda.";
const EMAIL   = "legal@wayvo.app.br";

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

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-300">
      {/* nav */}
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
          <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-500">Última atualização: {UPDATED}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8 text-sm text-gray-400 leading-relaxed">
          Ao criar uma conta ou utilizar a plataforma Wayvo, você declara ter lido, compreendido e concordado com os presentes Termos de Uso. Caso não concorde com qualquer disposição, não utilize nossos serviços.
        </div>

        <Section num="1" title="Definições">
          <p><strong className="text-gray-200">Wayvo</strong> refere-se a {COMPANY}, responsável pela plataforma de automação de comunicação via WhatsApp.</p>
          <p><strong className="text-gray-200">Usuário</strong> é qualquer pessoa física ou jurídica que acesse ou utilize os serviços da Wayvo.</p>
          <p><strong className="text-gray-200">Plataforma</strong> é o conjunto de ferramentas SaaS disponibilizadas em wayvo.app.br, incluindo disparos, automações, CRM de leads e integrações.</p>
        </Section>

        <Section num="2" title="Uso Aceitável">
          <p>O Usuário compromete-se a utilizar a Plataforma exclusivamente para fins lícitos, respeitando a legislação brasileira vigente, incluindo o Marco Civil da Internet (Lei nº 12.965/2014), o Código de Defesa do Consumidor e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
          <p>É expressamente proibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Enviar mensagens não solicitadas (spam) sem consentimento prévio dos destinatários;</li>
            <li>Utilizar a Plataforma para fins fraudulentos, ilegais ou que violem direitos de terceiros;</li>
            <li>Realizar disparos em massa de conteúdo enganoso, difamatório ou que induza ao erro;</li>
            <li>Tentar contornar limites de uso ou mecanismos de segurança da Plataforma;</li>
            <li>Revender ou sublicenciar o acesso à Plataforma sem autorização expressa.</li>
          </ul>
        </Section>

        <Section num="3" title="Responsabilidade pelo Conteúdo">
          <p>O Usuário é integralmente responsável pelo conteúdo das mensagens enviadas por meio da Plataforma, incluindo a obtenção do consentimento dos destinatários conforme exigido pela LGPD e pelas políticas do WhatsApp/Meta.</p>
          <p>A Wayvo não monitora o conteúdo das mensagens, mas reserva-se o direito de suspender contas que violem estes Termos ou as políticas das APIs de terceiros utilizadas.</p>
        </Section>

        <Section num="4" title="Planos, Pagamentos e Cancelamento">
          <p>Os planos e preços estão descritos na página de planos da Plataforma e podem ser alterados mediante aviso prévio de 30 dias.</p>
          <p>Os pagamentos são processados pela Stripe e estão sujeitos às condições do processador. Em caso de cancelamento, o acesso é mantido até o fim do período pago. Não há reembolso proporcional por períodos não utilizados, salvo obrigação legal.</p>
          <p>Inadimplência superior a 7 dias poderá resultar em suspensão do acesso.</p>
        </Section>

        <Section num="5" title="Propriedade Intelectual">
          <p>Todo o código-fonte, design, logotipos, marca e conteúdo da Plataforma são de propriedade exclusiva da Wayvo ou de seus licenciantes. É vedada a reprodução, distribuição ou criação de obras derivadas sem autorização prévia e expressa.</p>
        </Section>

        <Section num="6" title="Limitação de Responsabilidade">
          <p>A Wayvo não se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Suspensão ou banimento de números de WhatsApp por violação das políticas do Meta;</li>
            <li>Indisponibilidade de APIs de terceiros (WhatsApp, Meta Cloud API, OpenAI);</li>
            <li>Perda de dados decorrente de falhas de terceiros ou força maior;</li>
            <li>Danos indiretos, lucros cessantes ou perda de oportunidade de negócio.</li>
          </ul>
          <p>A responsabilidade total da Wayvo, em qualquer hipótese, fica limitada ao valor pago pelo Usuário nos últimos 3 meses.</p>
        </Section>

        <Section num="7" title="Rescisão">
          <p>A Wayvo pode rescindir ou suspender o acesso do Usuário imediatamente, sem aviso prévio, em caso de violação destes Termos, uso fraudulento ou determinação judicial.</p>
          <p>O Usuário pode cancelar sua conta a qualquer momento nas configurações da Plataforma.</p>
        </Section>

        <Section num="8" title="Alterações nos Termos">
          <p>Estes Termos podem ser alterados a qualquer momento. Alterações substanciais serão comunicadas por e-mail com antecedência de 15 dias. O uso continuado da Plataforma após a data de vigência implica aceitação dos novos Termos.</p>
        </Section>

        <Section num="9" title="Foro e Lei Aplicável">
          <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o Foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
        </Section>

        <Section num="10" title="Contato">
          <p>Dúvidas sobre estes Termos podem ser enviadas para <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a>.</p>
        </Section>

        <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm">
          <Link href="/privacidade" className="text-[#00FF88] hover:underline">Política de Privacidade</Link>
          <Link href="/login" className="text-gray-500 hover:text-gray-300">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
