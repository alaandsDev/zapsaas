"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQS } from "../lib/faq";

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#F5F6F8] py-24">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            <span className="size-1.5 rounded-full bg-[#0E8A47]" />
            Dúvidas frequentes
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            Tudo que você precisa saber
            <br />
            antes de começar
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4B5565]">
            Não achou a resposta?{" "}
            <a href="mailto:suporte@wayvo.app.br" className="text-[#0E8A47] hover:text-[#0B7239] hover:underline">
              Fale com a gente
            </a>
            .
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl bg-white overflow-hidden transition-all duration-200 border ${
                  isOpen ? "border-[#D2F0E0] shadow-[0_12px_30px_-20px_rgba(14,138,71,0.5)]" : "border-[#E9ECF1] hover:border-[#D2F0E0]"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className={`text-[15.5px] font-semibold ${isOpen ? "text-[#0E8A47]" : "text-[#0A1020]"}`}>
                    {item.q}
                  </span>
                  <span
                    className={`shrink-0 size-7 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isOpen
                        ? "bg-[#0E8A47] text-white border-[#0E8A47] rotate-45"
                        : "border-[#E4E7EC] text-[#8A94A6]"
                    }`}
                  >
                    <Plus className="size-4" strokeWidth={2.5} />
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-relaxed text-[#4B5565]">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
