"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Video, Phone, MoreVertical, Plus, Mic, Wifi, Signal, BatteryFull, CheckCheck } from "lucide-react";
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
      {/* Foto real de fundo — dá textura/vida ao hero, não só gradiente e texto */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.pexels.com/photos/34092083/pexels-photo-34092083/free-photo-of-smiling-man-in-souvenir-shop-using-smartphone.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="w-full h-full object-cover opacity-[0.12] mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/70 via-bg/90 to-bg" />
        {/* Mais opaco sobre o texto (esquerda), mais aberto perto do mockup (direita) */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg from-10% via-bg/75 via-45% to-bg/40" />
      </div>
      {/* Decoração fica contida perto do mockup — não compete com o texto */}
      <div className="absolute inset-y-0 right-0 w-[65%] opacity-40 pointer-events-none">
        <BackgroundPaths />
      </div>
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_55%_65%_at_78%_45%,black_25%,transparent_72%)]" />
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
        {["#25D366", "#3B82F6", "#8B5CF6", "#FBBF24"].map((c, i) => (
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
    <div className="relative mx-auto w-[300px] sm:w-[320px] lg:mx-0 lg:ml-auto">
      {/* Glow ambiente atrás do aparelho */}
      <div className="absolute -inset-6 bg-gradient-to-br from-primary/25 via-accent-blue/15 to-secondary/20 blur-3xl rounded-[3rem] pointer-events-none" />

      {/* Moldura do aparelho */}
      <div
        id="hero-chat-mockup"
        className="relative rotate-1 hover:rotate-0 transition-transform duration-500"
      >
        <div className="relative rounded-[2.75rem] bg-graphite-100 p-[6px] shadow-elevated">
          <div className="relative rounded-[2.35rem] overflow-hidden bg-[#0B141A]">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-graphite-100 rounded-b-2xl z-30" />

            {/* Status bar */}
            <div className="relative z-20 flex items-center justify-between px-6 pt-2.5 pb-1 text-white">
              <span className="text-[12px] font-semibold">9:41</span>
              <div className="flex items-center gap-1 text-white">
                <Signal className="size-3" strokeWidth={2.5} />
                <Wifi className="size-3" strokeWidth={2.5} />
                <BatteryFull className="size-3.5" strokeWidth={2} />
              </div>
            </div>

            {/* Header WhatsApp */}
            <div className="relative z-20 flex items-center gap-2 px-3 py-2.5 bg-[#1F2C34]">
              <ChevronLeft className="size-5 text-white/80 shrink-0" strokeWidth={2.5} />
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent-blue shrink-0 flex items-center justify-center text-[11px] font-bold text-bg">
                MS
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white leading-tight truncate">Maria Silva</div>
                <div className="text-[10.5px] text-primary leading-tight">online</div>
              </div>
              <div className="flex items-center gap-3 text-white/70 shrink-0">
                <Video className="size-4" strokeWidth={2.25} />
                <Phone className="size-3.5" strokeWidth={2.25} />
                <MoreVertical className="size-4" strokeWidth={2.25} />
              </div>
            </div>

            {/* Badge "IA ativa" sobre a conversa */}
            <div className="absolute top-[86px] right-3 z-20">
              <div className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-semibold backdrop-blur-sm">
                <Icon name="ai-sparkle" className="size-2.5" strokeWidth={2.25} />
                IA ativa
              </div>
            </div>

            {/* Conversa — encenada em tempo real, não um GIF de coreografia fixa */}
            <div
              className="relative z-10 space-y-1.5 px-2.5 pt-9 pb-3 min-h-[340px]"
              style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            >
              {visible.map((s, i) =>
                s.type === "bubble" ? (
                  <Bubble key={i} side={s.side}>{s.text}</Bubble>
                ) : s.type === "badge" ? (
                  <div key={i} className="flex justify-center mt-3 animate-scale-in">
                    <div className="inline-flex items-center gap-1.5 text-[10px] text-primary bg-primary/15 border border-primary/30 px-3 py-1 rounded-full animate-glow-pulse">
                      <Icon name="check" className="size-3" strokeWidth={2.5} />
                      Convertido pela IA em 47s
                    </div>
                  </div>
                ) : null
              )}
              {showTyping && <TypingIndicator />}
            </div>

            {/* Barra de input */}
            <div className="relative z-20 flex items-center gap-2 px-2.5 py-2 bg-[#1F2C34]">
              <Plus className="size-5 text-white/60 shrink-0" strokeWidth={2.25} />
              <div className="flex-1 h-8 rounded-full bg-white/[0.06] flex items-center px-3.5 text-[12px] text-white/35">
                Mensagem
              </div>
              <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Mic className="size-4 text-bg" strokeWidth={2.25} />
              </div>
            </div>

            {/* Home indicator */}
            <div className="relative z-20 flex justify-center py-2 bg-[#1F2C34]">
              <div className="w-28 h-1 rounded-full bg-white/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Card flutuante de stats */}
      <div className="hidden lg:block absolute -left-10 bottom-16 card p-4 shadow-xl bg-bg/95 backdrop-blur-sm z-30">
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
      <div className="hidden lg:block absolute -right-6 top-16 card p-3 shadow-xl bg-bg/95 backdrop-blur-sm max-w-[190px] z-30">
        <div className="flex items-center gap-2 mb-2">
          <div className="size-8 rounded-full overflow-hidden ring-2 ring-primary/30 shrink-0">
            <img src="https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop" alt="Cliente" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold leading-tight truncate">Ana Clara</div>
            <div className="text-[9px] text-ink-400 truncate">Loja de roupas · SP</div>
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
      className={`max-w-[82%] px-2.5 py-1.5 rounded-lg text-[13px] leading-snug shadow-sm animate-slide-up ${
        isOut
          ? "ml-auto bg-[#005C4B] text-white rounded-tr-sm"
          : "bg-[#202C33] text-white/90 rounded-tl-sm"
      }`}
    >
      {children}
      {isOut && (
        <span className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
          <span className="text-[9px] text-white/50">agora</span>
          <CheckCheck className="size-3 text-[#53BDEB]" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

// A digitação é o que faz a resposta da IA ler como uma ação acontecendo
// agora, não como texto que só apareceu — o "custo" que a mensagem seguinte precisa pagar.
function TypingIndicator() {
  return (
    <div className="max-w-[60%] ml-auto px-3 py-2.5 rounded-lg rounded-tr-sm bg-[#005C4B] animate-slide-up">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-white/70"
            style={{ animation: "typingDot 1.1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

const PARTNERS = [
  { name: "BellaPele", file: "bellapele.png" },
  { name: "SaborMix", file: "sabormix.png" },
  { name: "VisãoClara", file: "visaoclara.png" },
  { name: "LarIdeal", file: "larideal.png" },
  { name: "BemViver", file: "bemviver.png" },
  { name: "MundoPet", file: "mundopet.png" },
  { name: "MoveFit", file: "movefit.png" },
  { name: "AutoPrime", file: "autoprime.png" },
];

function SocialProofLogos() {
  // Duas cópias lado a lado: a animação anda -50% (a largura de 1 cópia) e reinicia sem "salto" visível.
  const track = [...PARTNERS, ...PARTNERS];
  return (
    <div className="mt-16 lg:mt-20">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-500 mb-6">
        Usado por 200+ negócios pelo Brasil
      </p>
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max items-center gap-3 sm:gap-4 animate-marquee">
          {track.map((p, i) => (
            <div
              key={`${p.file}-${i}`}
              className="group shrink-0 bg-white rounded-2xl size-20 sm:size-24 p-1.5 flex items-center justify-center shadow-sm hover:shadow-xl hover:shadow-primary/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer"
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
    </div>
  );
}
