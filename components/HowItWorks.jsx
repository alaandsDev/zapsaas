import Reveal from "./ui/Reveal";

export default function HowItWorks({ steps }) {
  return (
    <section id="como-funciona" className="bg-[#F5F6F8] py-24">
      <div className="container-x">
        <Reveal className="relative rounded-[28px] overflow-hidden border border-[#E9ECF1]">
          <div
            className="relative grid lg:grid-cols-[0.9fr_1.1fr]"
            style={{ background: "linear-gradient(160deg,#FFFFFF 0%,#F6F9F7 55%,#F1F6FB 100%)" }}
          >
            {/* Esquerda: texto + a agente ancorada na base do card */}
            <div className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[640px] overflow-hidden">
              <div className="relative z-10 p-8 sm:p-12">
                <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
                  Como funciona
                </div>
                <h2 className="text-[34px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.02em] text-[#0A1020]">
                  Funciona em<br />
                  <span className="text-[#0E8A47]">3 passos</span>
                </h2>
                <p className="mt-4 max-w-xs text-[16px] leading-relaxed text-[#4B5565]">
                  Sem programador, sem instalação. Em minutos seu negócio começa a vender no automático.
                </p>
              </div>
              <img
                src="/team/agente-wayvo.png"
                alt=""
                className="hidden sm:block absolute bottom-0 right-2 lg:right-6 w-[280px] lg:w-[380px] h-auto object-contain object-bottom pointer-events-none select-none"
              />
            </div>

            {/* Direita: passos conectados por uma trilha vertical verde */}
            <div className="relative p-8 sm:p-12 lg:py-16 border-t lg:border-t-0 lg:border-l border-[#E9ECF1]">
              <div className="relative">
                {/* Trilha — encostada no centro dos círculos (26px = metade de 52px) */}
                <div
                  className="absolute left-[26px] top-[52px] bottom-[52px] w-[2px] -translate-x-1/2 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, #0E8A47, rgba(14,138,71,0.25))" }}
                />
                <div className="relative space-y-12">
                  {steps.map((s, i) => (
                    <Reveal key={i} delay={Math.min(i * 90, 180)}>
                      <div className="flex items-start gap-5">
                        <div
                          className="relative z-10 size-[52px] shrink-0 rounded-full bg-[#0E8A47] text-white font-bold text-[20px] flex items-center justify-center"
                          style={{ boxShadow: "0 10px 22px -10px rgba(14,138,71,0.6)" }}
                        >
                          {i + 1}
                        </div>
                        <div className="pt-1.5">
                          <h3 className="text-[21px] font-bold text-[#0A1020] leading-snug">{s.title}</h3>
                          <p className="mt-2 max-w-md text-[16px] leading-relaxed text-[#4B5565]">{s.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
