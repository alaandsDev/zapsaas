import { TrendingUp, BadgeCheck, Star } from "lucide-react";
import Reveal from "./ui/Reveal";

export default function SocialProof({ testimonials }) {
  return (
    <section className="bg-[#ECEEF2] border-y border-[#E4E7EC] py-24">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            <span className="size-1.5 rounded-full bg-[#0E8A47] animate-pulse" />
            O que os clientes dizem
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            Histórias reais de quem
            <br />
            vende mais com o Wayvo
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal
              key={i}
              delay={Math.min(i * 90, 180)}
              as="figure"
              className="rounded-[20px] bg-white border border-[#E9ECF1] p-6 transition-all duration-200 hover:-translate-y-1 shadow-[0_4px_14px_-8px_rgba(10,16,32,0.14)] hover:shadow-[0_18px_38px_-20px_rgba(10,16,32,0.24)]"
            >
              {t.result && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF1] border border-[#D2F0E0] text-[#0E8A47] text-[11.5px] font-bold mb-4">
                  <TrendingUp className="size-3.5" strokeWidth={2.5} />
                  <span>{t.result}</span>
                </div>
              )}

              <div className="flex gap-0.5 mb-4">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="size-4 text-[#0E8A47]" fill="currentColor" strokeWidth={0} />
                ))}
              </div>

              <blockquote className="text-[15px] leading-relaxed text-[#0A1020]">“{t.quote}”</blockquote>

              <figcaption className="mt-6 pt-4 border-t border-[#EDEFF3] flex items-center gap-3">
                <div className="size-11 rounded-full overflow-hidden shrink-0 ring-2 ring-[#EDEFF3]">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold text-white"
                      style={{ background: t.color || "#0E8A47" }}
                    >
                      {t.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-[14px] text-[#0A1020]">{t.name}</div>
                  <div className="text-[12px] text-[#8A94A6]">{t.role}</div>
                </div>
                <div className="ml-auto" title="Cliente verificado">
                  <BadgeCheck className="size-5 text-[#0E8A47]" strokeWidth={2.25} />
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
