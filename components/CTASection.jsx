import Reveal from "./ui/Reveal";

export default function CTASection({
  title = "Sua operação no WhatsApp pode estar perdendo receita todo dia",
  subtitle = "Cada conversa sem resposta vira venda do concorrente. Com a Wayvo, CRM conversacional + automação + IA transformam cada contato em receita previsível.",
  cta = { label: "Ativar agora — 7 dias grátis", href: "/register" },
}) {
  return (
    <section className="bg-[#F5F6F8] py-24">
      <div className="container-x">
        <Reveal className="relative overflow-hidden rounded-[28px] border border-[#D9EDE3] p-10 lg:p-16 text-center">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(150deg,#F2FBF6 0%,#FFFFFF 45%,#F0F6FD 100%)" }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(rgba(10,16,32,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(10,16,32,0.035) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 size-[420px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(14,138,71,0.18), transparent 68%)", filter: "blur(30px)" }}
          />

          <div className="relative">
            <h2 className="max-w-3xl mx-auto text-[30px] sm:text-[38px] lg:text-[44px] font-bold leading-[1.08] tracking-[-0.025em] text-[#0A1020]">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl mx-auto text-[17px] leading-relaxed text-[#4B5565]">{subtitle}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-semibold text-white bg-[#0E8A47] hover:bg-[#0B7239] hover:-translate-y-px active:scale-[.98] transition-all duration-150 shadow-[0_12px_30px_rgba(14,138,71,0.32)]"
              >
                {cta.label} →
              </a>
            </div>
            <p className="mt-5 text-[13px] text-[#8A94A6]">
              Cobrança só depois do 7º dia · Cancele quando quiser · Operação no ar em 5 minutos
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
