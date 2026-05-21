"use client";
import { useEffect, useState } from "react";

const KEY = "zapflow_tour_done_v1";

const STEPS = [
  {
    selector: 'a[href="/dashboard/canais"]',
    placement: "right",
    title: "1. Comece por aqui",
    body: "Conecte seu WhatsApp em 30 segundos via QR Code. Sem chip novo, sem app paralelo.",
  },
  {
    selector: 'a[href="/dashboard/leads"]',
    placement: "right",
    title: "2. Importe sua base",
    body: "Suba um Excel/CSV ou cadastre na mão. A gente limpa duplicatas pra você automaticamente.",
  },
  {
    selector: 'a[href="/dashboard/campanhas"]',
    placement: "right",
    title: "3. Dispare e venda",
    body: "Mensagem personalizada com nome do cliente, mídia, agendamento — tudo em 2 cliques.",
  },
  {
    selector: 'a[href="/dashboard/automacao"]',
    placement: "right",
    title: "4. Automatize tudo (Pro)",
    body: "Monte fluxos visuais que respondem, qualificam e vendem 24h pra você.",
  },
];

export default function ProductTour() {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    // Pequeno delay pra DOM estar pronto + sidebar montada
    const t = setTimeout(() => setActive(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!active) return;
    const step = STEPS[idx];
    const el = document.querySelector(step.selector);
    if (!el) {
      // Tenta próximo passo se elemento sumiu
      if (idx < STEPS.length - 1) setIdx((i) => i + 1);
      else finish();
      return;
    }
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, idx]);

  if (!active || !rect) return null;

  function next() {
    if (idx < STEPS.length - 1) setIdx((i) => i + 1);
    else finish();
  }
  function prev() { if (idx > 0) setIdx((i) => i - 1); }
  function finish() {
    localStorage.setItem(KEY, "1");
    setActive(false);
  }

  const step = STEPS[idx];
  const popoverWidth = 320;

  // Posicionamento à direita do elemento destacado
  const popoverTop = Math.max(16, rect.top + rect.height / 2 - 80);
  const popoverLeft = rect.left + rect.width + 16;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      {/* Overlay com "buraco" no elemento alvo */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={finish}
        style={{
          clipPath: `polygon(
            0 0, 100% 0, 100% 100%, 0 100%, 0 0,
            ${rect.left - 6}px ${rect.top - 6}px,
            ${rect.left - 6}px ${rect.top + rect.height + 6}px,
            ${rect.left + rect.width + 6}px ${rect.top + rect.height + 6}px,
            ${rect.left + rect.width + 6}px ${rect.top - 6}px,
            ${rect.left - 6}px ${rect.top - 6}px
          )`,
        }}
      />
      {/* Highlight ring no alvo */}
      <div
        className="absolute rounded-xl ring-2 ring-primary shadow-[0_0_0_6px_rgba(0,255,178,0.15)] pointer-events-none animate-pulse"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      />

      {/* Popover */}
      <div
        className="absolute card p-5 shadow-2xl shadow-primary/20 bg-bg2/98 backdrop-blur-md border-primary/30 pointer-events-auto animate-fade-in"
        style={{ top: popoverTop, left: popoverLeft, width: popoverWidth, maxWidth: "calc(100vw - 32px)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
            Passo {idx + 1} de {STEPS.length}
          </span>
          <button onClick={finish} className="text-ink-500 hover:text-ink-100 text-xl leading-none">×</button>
        </div>
        <h4 className="text-base font-bold mb-2">{step.title}</h4>
        <p className="text-sm text-ink-300 leading-relaxed">{step.body}</p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= idx ? "bg-primary" : "bg-white/10"}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-5">
          <button onClick={finish} className="text-xs text-ink-400 hover:text-ink-200">
            Pular tour
          </button>
          <div className="flex gap-2">
            {idx > 0 && (
              <button onClick={prev} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm">
                ← Voltar
              </button>
            )}
            <button onClick={next} className="px-4 py-1.5 rounded-lg bg-primary text-bg font-semibold text-sm hover:opacity-90">
              {idx === STEPS.length - 1 ? "Concluir 🎉" : "Próximo →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
