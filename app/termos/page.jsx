import Link from "next/link";

export const metadata = {
  title: "Termos de Uso â€” Wayvo",
  description: "Termos e condiÃ§Ãµes de uso da plataforma Wayvo.",
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
          Entrar â†’
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-sm text-gray-500">Ãšltima atualizaÃ§Ã£o: {UPDATED}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-8 text-sm text-gray-400 leading-relaxed">
          Ao criar uma conta ou utilizar a plataforma Wayvo, vocÃª declara ter lido, compreendido e concordado com os presentes Termos de Uso. Caso nÃ£o concorde com qualquer disposiÃ§Ã£o, nÃ£o utilize nossos serviÃ§os.
        </div>

        <Section num="1" title="DefiniÃ§Ãµes">
          <p><strong className="text-gray-200">Wayvo</strong> refere-se a {COMPANY}, responsÃ¡vel pela plataforma de automaÃ§Ã£o de comunicaÃ§Ã£o via WhatsApp.</p>
          <p><strong className="text-gray-200">UsuÃ¡rio</strong> Ã© qualquer pessoa fÃ­sica ou jurÃ­dica que acesse ou utilize os serviÃ§os da Wayvo.</p>
          <p><strong className="text-gray-200">Plataforma</strong> Ã© o conjunto de ferramentas SaaS disponibilizadas em wayvo.app.br, incluindo disparos, automaÃ§Ãµes, CRM de leads e integraÃ§Ãµes.</p>
        </Section>

        <Section num="2" title="Uso AceitÃ¡vel">
          <p>O UsuÃ¡rio compromete-se a utilizar a Plataforma exclusivamente para fins lÃ­citos, respeitando a legislaÃ§Ã£o brasileira vigente, incluindo o Marco Civil da Internet (Lei nÂº 12.965/2014), o CÃ³digo de Defesa do Consumidor e a Lei Geral de ProteÃ§Ã£o de Dados (Lei nÂº 13.709/2018).</p>
          <p>Ã‰ expressamente proibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Enviar mensagens nÃ£o solicitadas (spam) sem consentimento prÃ©vio dos destinatÃ¡rios;</li>
            <li>Utilizar a Plataforma para fins fraudulentos, ilegais ou que violem direitos de terceiros;</li>
            <li>Realizar disparos em massa de conteÃºdo enganoso, difamatÃ³rio ou que induza ao erro;</li>
            <li>Tentar contornar limites de uso ou mecanismos de seguranÃ§a da Plataforma;</li>
            <li>Revender ou sublicenciar o acesso Ã  Plataforma sem autorizaÃ§Ã£o expressa.</li>
          </ul>
        </Section>

        <Section num="3" title="Responsabilidade pelo ConteÃºdo">
          <p>O UsuÃ¡rio Ã© integralmente responsÃ¡vel pelo conteÃºdo das mensagens enviadas por meio da Plataforma, incluindo a obtenÃ§Ã£o do consentimento dos destinatÃ¡rios conforme exigido pela LGPD e pelas polÃ­ticas do WhatsApp/Meta.</p>
          <p>A Wayvo nÃ£o monitora o conteÃºdo das mensagens, mas reserva-se o direito de suspender contas que violem estes Termos ou as polÃ­ticas das APIs de terceiros utilizadas.</p>
        </Section>

        <Section num="4" title="Planos, Pagamentos e Cancelamento">
          <p>Os planos e preÃ§os estÃ£o descritos na pÃ¡gina de planos da Plataforma e podem ser alterados mediante aviso prÃ©vio de 30 dias.</p>
          <p>Os pagamentos sÃ£o processados pela Stripe e estÃ£o sujeitos Ã s condiÃ§Ãµes do processador. Em caso de cancelamento, o acesso Ã© mantido atÃ© o fim do perÃ­odo pago. NÃ£o hÃ¡ reembolso proporcional por perÃ­odos nÃ£o utilizados, salvo obrigaÃ§Ã£o legal.</p>
          <p>InadimplÃªncia superior a 7 dias poderÃ¡ resultar em suspensÃ£o do acesso.</p>
        </Section>

        <Section num="5" title="Propriedade Intelectual">
          <p>Todo o cÃ³digo-fonte, design, logotipos, marca e conteÃºdo da Plataforma sÃ£o de propriedade exclusiva da Wayvo ou de seus licenciantes. Ã‰ vedada a reproduÃ§Ã£o, distribuiÃ§Ã£o ou criaÃ§Ã£o de obras derivadas sem autorizaÃ§Ã£o prÃ©via e expressa.</p>
        </Section>

        <Section num="6" title="LimitaÃ§Ã£o de Responsabilidade">
          <p>A Wayvo nÃ£o se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>SuspensÃ£o ou banimento de nÃºmeros de WhatsApp por violaÃ§Ã£o das polÃ­ticas do Meta;</li>
            <li>Indisponibilidade de APIs de terceiros (WhatsApp, Meta Cloud API, OpenAI);</li>
            <li>Perda de dados decorrente de falhas de terceiros ou forÃ§a maior;</li>
            <li>Danos indiretos, lucros cessantes ou perda de oportunidade de negÃ³cio.</li>
          </ul>
          <p>A responsabilidade total da Wayvo, em qualquer hipÃ³tese, fica limitada ao valor pago pelo UsuÃ¡rio nos Ãºltimos 3 meses.</p>
        </Section>

        <Section num="7" title="RescisÃ£o">
          <p>A Wayvo pode rescindir ou suspender o acesso do UsuÃ¡rio imediatamente, sem aviso prÃ©vio, em caso de violaÃ§Ã£o destes Termos, uso fraudulento ou determinaÃ§Ã£o judicial.</p>
          <p>O UsuÃ¡rio pode cancelar sua conta a qualquer momento nas configuraÃ§Ãµes da Plataforma.</p>
        </Section>

        <Section num="8" title="AlteraÃ§Ãµes nos Termos">
          <p>Estes Termos podem ser alterados a qualquer momento. AlteraÃ§Ãµes substanciais serÃ£o comunicadas por e-mail com antecedÃªncia de 15 dias. O uso continuado da Plataforma apÃ³s a data de vigÃªncia implica aceitaÃ§Ã£o dos novos Termos.</p>
        </Section>

        <Section num="9" title="Foro e Lei AplicÃ¡vel">
          <p>Estes Termos sÃ£o regidos pela legislaÃ§Ã£o brasileira. Fica eleito o Foro da Comarca de SÃ£o Paulo/SP para dirimir quaisquer controvÃ©rsias, com renÃºncia a qualquer outro, por mais privilegiado que seja.</p>
        </Section>

        <Section num="10" title="Contato">
          <p>DÃºvidas sobre estes Termos podem ser enviadas para <a href={`mailto:${EMAIL}`} className="text-[#00FF88] hover:underline">{EMAIL}</a>.</p>
        </Section>

        <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-wrap gap-4 text-sm">
          <Link href="/privacidade" className="text-[#00FF88] hover:underline">PolÃ­tica de Privacidade</Link>
          <Link href="/login" className="text-gray-500 hover:text-gray-300">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
