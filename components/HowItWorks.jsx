"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "./ui/Reveal";

export default function HowItWorks({ steps, title = "Funciona em 3 passos" }) {
  const containerRef = useRef(null);
  const badgeRefs = useRef([]);
  const [path, setPath] = useState("");

  // Mede a posição real de cada badge numerado e desenha a trilha em degraus
  // conectando eles — assim o traço sempre acompanha o layout de verdade
  // (responsivo, texto de tamanho variável), em vez de coordenadas fixas
  // que quebrariam em qualquer viewport diferente do que eu testei.
  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const points = badgeRefs.current.filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2 - cRect.left, y: r.top + r.height / 2 - cRect.top };
      });
      if (points.length < 2) { setPath(""); return; }
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        const midY = (prev.y + cur.y) / 2;
        d += ` V ${midY} H ${cur.x} V ${cur.y}`;
      }
      setPath(d);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [steps]);

  return (
    <section id="como-funciona" className="py-24">
      <div className="container-x">
        <Reveal className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-card via-card to-bg shadow-elevated">
          <div className="relative grid lg:grid-cols-[0.85fr_1.15fr]">

            {/* Coluna esquerda: texto + foto — sem padding na coluna em si (só no
                texto), pra imagem poder encostar de verdade na base do card em
                vez de parar no padding e sobrar um vão vazio embaixo dela. */}
            <div className="relative min-h-[360px] lg:min-h-[520px] overflow-hidden">
              <svg className="absolute bottom-6 left-2 size-36 sm:size-44 text-primary/15 pointer-events-none" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2 3 14h7l-1 8 11-14h-7z" />
              </svg>
              <div className="relative z-10 p-8 sm:p-12">
                <div className="eyebrow mb-4">Como funciona</div>
                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                  Funciona em<br /><span className="text-primary">3 passos</span>
                </h2>
                <p className="mt-4 text-ink-300 max-w-xs">
                  Sem programador, sem instalação. Em minutos seu negócio começa a vender no automático.
                </p>
              </div>
              <img
                src="/team/agente-wayvo.png"
                alt=""
                className="hidden sm:block absolute bottom-0 right-2 lg:right-6 w-[220px] lg:w-[280px] h-auto object-contain object-bottom pointer-events-none select-none"
              />
            </div>

            {/* Coluna direita: passos numerados, conectados pela trilha.
                items-stretch (padrão do grid) já iguala a altura das duas
                colunas — aqui só centralizo o conteúdo verticalmente também,
                pra não ficar grudado no topo com vão vazio embaixo enquanto
                a foto ocupa a coluna esquerda até a base. */}
            <div
              ref={containerRef}
              className="relative flex flex-col justify-center p-8 sm:p-12 lg:py-16 border-t lg:border-t-0 lg:border-l border-white/[0.08]"
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
                {path && (
                  <path
                    d={path}
                    fill="none"
                    stroke="#25D366"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div className="relative space-y-10">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4" style={{ marginLeft: `${i * 48}px` }}>
                    <div
                      ref={(el) => (badgeRefs.current[i] = el)}
                      className="relative z-10 size-11 shrink-0 rounded-xl bg-primary text-bg font-bold flex items-center justify-center shadow-glow"
                    >
                      {i + 1}
                    </div>
                    <div className="pt-1.5">
                      <h3 className="text-lg font-bold text-primary">{s.title}</h3>
                      <p className="text-ink-300 mt-1 text-sm leading-relaxed max-w-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}
