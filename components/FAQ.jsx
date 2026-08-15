"use client";
import { useState } from "react";
import { FAQS } from "../lib/faq";

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-24 border-t border-white/[0.06]">
      <div className="container-x">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow justify-center mb-4">
            <span className="size-1.5 rounded-full bg-primary" />
            Dúvidas frequentes
          </div>
          <h2 className="text-h2">Tudo que você precisa saber<br />antes de começar</h2>
          <p className="text-ink-300 mt-4 text-lg">
            Não achou a resposta?{" "}
            <a href="mailto:suporte@wayvo.app.br" className="text-primary hover:underline">
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
                className={`glass overflow-hidden transition-all ${isOpen ? "border-primary/30" : "hover:border-white/15"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className={`font-semibold ${isOpen ? "text-primary" : "text-ink-100"}`}>{item.q}</span>
                  <span className={`shrink-0 size-7 rounded-full border flex items-center justify-center text-sm transition-all ${
                    isOpen ? "bg-primary text-bg border-primary rotate-45" : "border-white/15 text-ink-400"
                  }`}>+</span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-ink-300 leading-relaxed">{item.a}</p>
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
