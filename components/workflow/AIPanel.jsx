"use client";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  {
    icon: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
    tint: "#00FF88",
    title: "Adicionar follow-up",
    text: "Fluxos com follow-up após 24h convertem +38% em média.",
    cta: "Aplicar",
  },
  {
    icon: "M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z",
    tint: "#FBBF24",
    title: "Melhor horário detectado",
    text: "Seus contatos respondem mais entre 19h–21h. Agende o disparo.",
    cta: "Otimizar",
  },
  {
    icon: "M12 2a5 5 0 015 5c0 1.5 3 2.5 3 5a5 5 0 01-5 5h-1v3H8v-3H7a5 5 0 01-5-5c0-2.5 3-3.5 3-5a5 5 0 015-5z",
    tint: "#7C3AED",
    title: "Esse fluxo pode converter mais",
    text: "Trocar o 2º bloco por uma pergunta aumenta engajamento.",
    cta: "Ver sugestão",
  },
];

export default function AIPanel() {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="size-7 rounded-lg bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 015 5c0 1.5 3 2.5 3 5a5 5 0 01-5 5h-1v3H8v-3H7a5 5 0 01-5-5c0-2.5 3-3.5 3-5a5 5 0 015-5z" />
          </svg>
        </span>
        <div className="text-sm font-semibold">Copiloto IA</div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
          ativo
        </span>
      </div>
      <div className="space-y-2.5">
        {SUGGESTIONS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 hover:border-white/[0.14] transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <span
                className="size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${s.tint}1f`, border: `1px solid ${s.tint}44` }}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke={s.tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-ink-100">{s.title}</div>
                <div className="text-[11px] text-ink-300 mt-0.5 leading-snug">{s.text}</div>
                <button
                  className="mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                  style={{ color: s.tint, background: `${s.tint}1a` }}
                >
                  {s.cta}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
