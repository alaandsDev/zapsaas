"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BackgroundPaths from "./BackgroundPaths";
import Icon from "./ui/Icon";

export default function Hero({
  eyebrow = "Conversational Revenue OS · AI-first",
  title,
  highlight,
  subtitle,
  primaryCTA = { label: "Começar agora", href: "/register" },
  secondaryCTA = { label: "Ver como funciona", href: "#como-funciona" },
  metrics,
}) {
  return (
    <section className="relative overflow-hidden">
      <BackgroundPaths />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-accent-blue/10 blur-3xl pointer-events-none" />

      <div className="container-x relative pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-[1.1fr_1fr] items-center gap-10 lg:gap-16">
          {/* Texto */}
          <div>
            <div className="eyebrow mb-6">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {eyebrow}
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
              {title}{" "}
              {highlight && <span className="gradient-text">{highlight}</span>}
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-ink-300 max-w-xl leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={primaryCTA.href} className="btn-primary text-base">
                {primaryCTA.label} →
              </a>
              <a href={secondaryCTA.href} className="btn-ghost text-base">
                {secondaryCTA.label}
              </a>
            </div>
            <p className="mt-5 text-sm text-ink-500">
              Plano Starter grátis · Sem cartão · Configure em 5 minutos
            </p>
            <LiveCounter />
          </div>

          {/* Mockup do produto (chat WhatsApp animado) */}
          <ProductMockup />
        </div>

        {/* Logos sociais */}
        <SocialProofLogos />

        {metrics && (
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, i) => (
              <div key={i} className="glass p-5 transition-transform hover:-translate-y-1">
                <div className="text-xl font-bold gradient-text">{m.value}</div>
                <div className="text-sm text-ink-300 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LiveCounter() {
  // Marca apenas no client (não em SSR — pra evitar mismatch). Usa script inline.
  return (
    <div className="mt-8 flex items-center gap-3 text-sm">
      <div className="flex -space-x-2">
        {["#00FFB2", "#3B82F6", "#8B5CF6", "#FBBF24"].map((c, i) => (
          <div
            key={i}
            className="size-7 rounded-full border-2 border-bg flex items-center justify-center text-[10px] font-bold text-bg"
            style={{ background: c }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <div className="text-ink-300">
        <span className="text-primary font-semibold inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          27 operações
        </span> ativas agora na Wayvo
      </div>
    </div>
  );
}

// Roteiro do momento autoral: a IA fecha uma venda em tempo real.
// Cada passo é a menor unidade de "o que a IA está fazendo agora" —
// a digitação existe para tornar a resposta um evento, não um corte.
const SCRIPT = [
  { at: 200,  type: "bubble", side: "in",  text: "Tem promoção hoje?" },
  { at: 1100, type: "typing", side: "out" },
  { at: 2400, type: "bubble", side: "out", text: "Oi Maria! 👋 Hoje só pra você: 40% off no kit completo. Garante o seu?" },
  { at: 3300, type: "bubble", side: "in",  text: "Quero! Como pago?" },
  { at: 4200, type: "typing", side: "out" },
  { at: 5400, type: "bubble", side: "out", text: "Manda PIX pra wayvo@... Já reservei o último kit pro seu nome 🚀" },
  { at: 6300, type: "badge" },
];
const LOOP_PAUSE = 3200; // tempo parado no estado final antes de reiniciar

function ProductMockup() {
  const [step, setStep] = useState(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedRef.current) {
      setStep(SCRIPT.length); // estado final direto, sem coreografia
      return;
    }

    let cancelled = false;
    const timers = [];

    function run() {
      setStep(0);
      SCRIPT.forEach((_, i) => {
        timers.push(setTimeout(() => { if (!cancelled) setStep(i + 1); }, SCRIPT[i].at));
      });
      const last = SCRIPT[SCRIPT.length - 1].at + LOOP_PAUSE;
      timers.push(setTimeout(() => { if (!cancelled) run(); }, last));
    }

    // Só anima quando o card está visível na tela (evita gastar ciclos escondido).
    const el = document.getElementById("hero-chat-mockup");
    let io;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      }, { threshold: 0.3 });
      io.observe(el);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      io?.disconnect();
    };
  }, []);

  const visible = SCRIPT.slice(0, step);
  const showTyping = visible.at(-1)?.type === "typing";

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-blue/20 blur-2xl rounded-3xl" />
      <div id="hero-chat-mockup" className="relative card p-3 shadow-2xl shadow-primary/10 rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Header do "celular" */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent-blue" />
            <div>
              <div className="text-sm font-semibold">Maria Silva</div>
              <div className="text-[10px] text-primary">online</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
            <Icon name="ai-sparkle" className="size-3" strokeWidth={2.25} />
            IA ativa
          </div>
        </div>

        {/* Conversa — encenada em tempo real, não um GIF de coreografia fixa */}
        <div className="space-y-2 p-3 min-h-[280px]">
          {visible.map((s, i) =>
            s.type === "bubble" ? (
              <Bubble key={i} side={s.side}>{s.text}</Bubble>
            ) : s.type === "badge" ? (
              <div key={i} className="flex justify-center mt-3 animate-scale-in">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full animate-glow-pulse">
                  <Icon name="check" className="size-3" strokeWidth={2.5} />
                  Convertido pela IA em 47s
                </div>
              </div>
            ) : null
          )}
          {showTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Card flutuante de stats */}
      <div className="hidden lg:block absolute -left-8 bottom-8 card p-4 shadow-xl bg-bg/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Icon name="revenue" className="size-5" />
          </div>
          <div>
            <div className="text-xs text-ink-400">Receita atribuída hoje</div>
            <div className="text-xl font-bold text-primary">+R$ 12.847</div>
          </div>
        </div>
      </div>

      {/* Card flutuante com cliente real */}
      <div className="hidden lg:block absolute -right-4 top-6 card p-3 shadow-xl bg-bg/95 backdrop-blur-sm max-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-full overflow-hidden ring-2 ring-primary/30">
            <img src="https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" alt="Cliente" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[11px] font-semibold leading-tight">Ana Clara</div>
            <div className="text-[9px] text-ink-400">Loja de roupas · SP</div>
          </div>
        </div>
        <div className="text-[10px] text-ink-300 bg-primary/5 border border-primary/15 rounded-lg px-2 py-1.5 leading-relaxed">
          "Faturei R$ 8k em 3 dias só pelo Wayvo"
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, children }) {
  const isOut = side === "out";
  return (
    <div
      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm animate-slide-up ${
        isOut
          ? "ml-auto bg-primary/15 border border-primary/20 rounded-br-sm"
          : "bg-card2 border border-white/10 rounded-bl-sm"
      }`}
    >
      {children}
    </div>
  );
}

// A digitação é o que faz a resposta da IA ler como uma ação acontecendo
// agora, não como texto que só apareceu — o "custo" que a mensagem seguinte precisa pagar.
function TypingIndicator() {
  return (
    <div className="max-w-[80%] ml-auto px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-primary/15 border border-primary/20 animate-slide-up">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-primary/70"
            style={{ animation: "typingDot 1.1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function SocialProofLogos() {
  return (
    <div className="mt-16 lg:mt-20">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-500 mb-6">
        Usado por 200+ negócios pelo Brasil
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {[
          { name: "BellaPele", file: "bellapele.png" },
          { name: "SaborMix", file: "sabormix.png" },
          { name: "VisãoClara", file: "visaoclara.png" },
          { name: "LarIdeal", file: "larideal.png" },
          { name: "BemViver", file: "bemviver.png" },
          { name: "MundoPet", file: "mundopet.png" },
          { name: "MoveFit", file: "movefit.png" },
          { name: "AutoPrime", file: "autoprime.png" },
        ].map((p) => (
          <div
            key={p.file}
            className="group bg-white rounded-2xl size-20 sm:size-24 p-1.5 flex items-center justify-center shadow-sm hover:shadow-xl hover:shadow-primary/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer"
          >
            <Image
              src={`/partners/${p.file}`}
              alt={p.name}
              width={96}
              height={96}
              loading="lazy"
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
