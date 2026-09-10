"use client";
import { Send, MessagesSquare, Bot, Brain, TrendingUp, Zap, MessageCircle } from "lucide-react";
import Reveal from "./ui/Reveal";

// Sistema solar: o WhatsApp é o "sol" no centro, e cada capacidade do Wayvo
// orbita em um dos dois anéis — cada anel gira num sentido e numa velocidade.
// Cada cápsula contragira na mesma duração pra continuar sempre legível.
const RINGS = [
  {
    radius: 30,
    duration: 46,
    direction: "cw",
    items: [
      { icon: Brain, label: "Copiloto de IA", angle: -90 },
      { icon: MessagesSquare, label: "CRM de leads", angle: 30 },
      { icon: Bot, label: "Automação 24/7", angle: 150 },
    ],
  },
  {
    radius: 45,
    duration: 72,
    direction: "ccw",
    items: [
      { icon: Send, label: "Disparo em massa", angle: -30 },
      { icon: TrendingUp, label: "Receita rastreada", angle: 90 },
      { icon: Zap, label: "Resposta instantânea", angle: 210 },
    ],
  },
];

function pointFor(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

export default function CapabilitiesOrbit() {
  return (
    <section className="bg-[#ECEEF2] border-y border-[#E4E7EC] py-24 overflow-hidden">
      <div className="container-x relative">
        <Reveal className="max-w-2xl mx-auto text-center">
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#0E8A47] mb-4">
            Do seu jeito
          </div>
          <h2 className="text-[30px] sm:text-[42px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0A1020]">
            Não tem um jeito certo de usar.
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(100deg,#0E8A47,#2F80ED)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Tem o seu jeito.
            </span>
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4B5565]">
            Não importa como você fala ou o que você pede — é só mandar mensagem
            que o Wayvo entende, executa e te dá o retorno na hora.
          </p>
        </Reveal>

        <Reveal delay={120} className="relative mx-auto mt-16 aspect-square w-full max-w-[560px]">
          {/* Trajetórias */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            {RINGS.map((ring, i) => (
              <circle
                key={i}
                cx="50" cy="50" r={ring.radius}
                fill="none"
                stroke="#0E8A47"
                strokeOpacity="0.22"
                strokeWidth="0.4"
                strokeDasharray="1 1.8"
              />
            ))}
          </svg>

          {/* Centro */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div
              className="relative flex items-center justify-center size-[68px] sm:size-20 rounded-full bg-white"
              style={{ boxShadow: "0 16px 34px -16px rgba(10,16,32,0.28)" }}
            >
              <div className="absolute inset-0 rounded-full ring-[6px] ring-[#0E8A47]/12 animate-glow-pulse" />
              <MessageCircle className="size-8 sm:size-9 text-[#0E8A47]" strokeWidth={2} />
            </div>
          </div>

          {/* Cápsulas orbitando */}
          {RINGS.map((ring, ri) => {
            const outerClass = ring.direction === "cw" ? "animate-orbit-cw" : "animate-orbit-ccw";
            const counterClass = ring.direction === "cw" ? "animate-orbit-ccw" : "animate-orbit-cw";
            return (
              <div key={ri} className={`absolute inset-0 ${outerClass}`} style={{ animationDuration: `${ring.duration}s` }}>
                {ring.items.map((c, i) => {
                  const p = pointFor(c.angle, ring.radius);
                  const CapIcon = c.icon;
                  return (
                    <div key={i} className="absolute z-10" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                      <div
                        className={`${counterClass} -translate-x-1/2 -translate-y-1/2`}
                        style={{ animationDuration: `${ring.duration}s` }}
                      >
                        <div
                          className="flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full bg-white border border-[#E9ECF1] whitespace-nowrap"
                          style={{ boxShadow: "0 10px 24px -14px rgba(10,16,32,0.28)" }}
                        >
                          <span className="flex items-center justify-center size-7 rounded-full bg-[#EAFBF1] text-[#0E8A47] shrink-0">
                            <CapIcon className="size-3.5" strokeWidth={2.25} />
                          </span>
                          <span className="text-[12px] sm:text-[13px] font-semibold text-[#0A1020]">{c.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
