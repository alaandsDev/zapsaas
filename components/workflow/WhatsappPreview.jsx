"use client";
import { AnimatePresence, motion } from "framer-motion";

const KIND_META = {
  message: null,
  image: { tag: "📷 Imagem", tint: "#F472B6" },
  audio: { tag: "🎙️ Áudio 0:08", tint: "#A78BFA" },
  video: { tag: "🎬 Vídeo", tint: "#FB7185" },
  ia: { tag: "✨ Resposta IA", tint: "#7C3AED" },
  choice: { tag: null, tint: "#38BDF8" },
};

export default function WhatsappPreview({ nodes }) {
  const bubbles = nodes
    .filter((n) => ["message", "image", "audio", "video", "ia", "choice"].includes(n.data.kind))
    .map((n) => ({
      id: n.id,
      kind: n.data.kind,
      title: n.data.title,
      body: n.data.body || "",
    }));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[270px] rounded-[2.2rem] border border-white/10 bg-[#0b141a] overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-20 h-4 bg-black rounded-full z-10" />
        {/* header */}
        <div className="flex items-center gap-2.5 px-4 pt-7 pb-3 bg-[#1f2c33]">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-bg text-xs font-bold">
            Z
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-white truncate">Wayvo Bot</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
            </div>
          </div>
        </div>
        {/* chat */}
        <div
          className="h-[380px] overflow-y-auto px-3 py-4 space-y-2"
          style={{
            backgroundColor: "#0b141a",
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <AnimatePresence initial={false}>
            {bubbles.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-[11px] text-ink-500 mt-24"
              >
                Adicione blocos de mensagem
                <br /> para ver o preview ao vivo
              </motion.div>
            )}
            {bubbles.map((b, i) => {
              const meta = KIND_META[b.kind];
              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), type: "spring", stiffness: 300, damping: 24 }}
                  className="max-w-[78%] rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2 shadow-md"
                >
                  {meta?.tag && (
                    <div
                      className="text-[10px] font-semibold mb-1"
                      style={{ color: meta.tint }}
                    >
                      {meta.tag}
                    </div>
                  )}
                  <div className="text-[12px] leading-snug text-[#e9edef] whitespace-pre-wrap break-words">
                    {b.body || (
                      <span className="text-ink-500 italic">
                        {b.title || "mensagem vazia"}
                      </span>
                    )}
                  </div>
                  {b.kind === "choice" && (
                    <div className="mt-2 space-y-1">
                      {["Sim, quero", "Falar com humano"].map((o) => (
                        <div
                          key={o}
                          className="text-[11px] text-center text-emerald-400 border-t border-white/10 pt-1.5 first:border-t-0 first:pt-0"
                        >
                          {o}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[9px] text-ink-500 text-right mt-0.5">
                    {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <div className="text-[11px] text-ink-500 mt-3">Preview WhatsApp ao vivo</div>
    </div>
  );
}
