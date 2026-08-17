"use client";
import { Send, MessagesSquare, Bot, Brain, TrendingUp, Zap, ChevronRight } from "lucide-react";
import Reveal from "./ui/Reveal";

const CAPABILITIES = [
  { icon: Send, label: "Disparo em massa", angle: -90 },
  { icon: MessagesSquare, label: "CRM de leads", angle: -30 },
  { icon: TrendingUp, label: "Receita rastreada", angle: 30 },
  { icon: Bot, label: "Automação 24/7", angle: 90 },
  { icon: Zap, label: "Resposta instantânea", angle: 150 },
  { icon: Brain, label: "Copiloto de IA", angle: 210 },
];

const RADIUS = 42; // % do raio do container

function pointFor(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + RADIUS * Math.cos(rad),
    y: 50 + RADIUS * Math.sin(rad),
  };
}

export default function CapabilitiesOrbit() {
  return (
    <section className="section-light py-24 overflow-hidden">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mx-auto text-center mb-6">
          <div className="eyebrow-light justify-center mb-4">Do seu jeito</div>
          <h2 className="text-h2 text-graphite-100">
            Não tem um jeito certo de usar.<br />
            <span className="gradient-text-light">Tem o seu jeito.</span>
          </h2>
          <p className="mt-4 text-graphite-100/60 text-lg">
            Não importa como você fala ou o que você pede — é só mandar mensagem
            que o Wayvo entende, executa e te dá o retorno na hora.
          </p>
        </Reveal>

        <Reveal delay={120} className="relative mx-auto mt-16 aspect-square w-full max-w-[560px]">
          {/* Anéis + linhas conectando o centro a cada badge */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <circle cx="50" cy="50" r="20" fill="none" stroke="#128C4A" strokeOpacity="0.12" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#128C4A" strokeOpacity="0.1" strokeWidth="0.3" strokeDasharray="1.2 1.6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#128C4A" strokeOpacity="0.08" strokeWidth="0.3" strokeDasharray="0.6 2" />
            {CAPABILITIES.map((c, i) => {
              const p = pointFor(c.angle);
              return (
                <g key={i}>
                  <line x1="50" y1="50" x2={p.x} y2={p.y} stroke="#128C4A" strokeOpacity="0.18" strokeWidth="0.35" strokeDasharray="0.8 1.4" />
                  <circle cx={p.x} cy={p.y} r="0.9" fill="#25D366" fillOpacity="0.5" />
                </g>
              );
            })}
          </svg>

          {/* Centro — ícone do WhatsApp */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative flex items-center justify-center size-16 sm:size-20 rounded-full bg-white shadow-paper-card">
              <div className="absolute inset-0 rounded-full ring-4 ring-primary/15 animate-glow-pulse" />
              <svg viewBox="0 0 32 32" className="size-8 sm:size-10 text-primary" fill="currentColor">
                <path d="M16.004 2.667C8.64 2.667 2.67 8.636 2.67 16c0 2.51.697 4.858 1.906 6.86L2.667 29.333l6.65-1.87A13.28 13.28 0 0016.004 29.333c7.363 0 13.333-5.97 13.333-13.333S23.367 2.667 16.004 2.667zm0 24.213a11.05 11.05 0 01-5.976-1.744l-.428-.27-4.336 1.22 1.18-4.32-.284-.436A11.02 11.02 0 014.947 16C4.947 9.9 9.9 4.947 16.004 4.947S27.06 9.9 27.06 16s-4.953 11.053-11.056 11.053zm6.06-8.284c-.332-.166-1.964-.97-2.27-1.08-.305-.112-.527-.166-.75.166-.222.332-.86 1.08-1.054 1.302-.194.222-.388.25-.72.083-.332-.166-1.402-.517-2.67-1.65-.987-.88-1.654-1.966-1.848-2.298-.194-.332-.02-.512.146-.677.15-.15.332-.388.498-.583.166-.194.222-.332.332-.554.11-.222.056-.416-.028-.583-.083-.166-.75-1.807-1.028-2.475-.27-.65-.545-.562-.75-.572l-.638-.012c-.222 0-.583.083-.888.416-.305.332-1.166 1.14-1.166 2.78 0 1.64 1.194 3.226 1.36 3.448.166.222 2.352 3.593 5.7 5.04.796.343 1.417.548 1.902.702.799.254 1.526.218 2.1.132.64-.096 1.964-.803 2.242-1.578.278-.775.278-1.44.194-1.578-.083-.138-.305-.222-.638-.388z" />
              </svg>
            </div>
          </div>

          {/* Badges das capacidades */}
          {CAPABILITIES.map((c, i) => {
            const p = pointFor(c.angle);
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-float"
                style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${4 + (i % 3)}s` }}
              >
                <div className="group flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-full bg-white shadow-paper-card hover:shadow-paper-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-default whitespace-nowrap">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary-dark shrink-0">
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-graphite-100">{c.label}</span>
                  <ChevronRight className="size-3.5 text-graphite-100/30 group-hover:text-primary-dark group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
