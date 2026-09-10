"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Video, Phone, MoreVertical, Plus, Mic, Wifi, Signal,
  BatteryFull, CheckCheck, Sparkles, Check, TrendingUp,
} from "lucide-react";

const GRADIENT_TEXT = {
  backgroundImage: "linear-gradient(100deg,#0E8A47 0%,#25D366 40%,#2F80ED 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export default function Hero({
  eyebrow = "Automação de vendas no WhatsApp · Com IA",
  title,
  highlight,
  subtitle,
  primaryCTA = { label: "Começar agora", href: "/register" },
  secondaryCTA = { label: "Ver a plataforma", href: "#como-funciona" },
}) {
  return (
    <section id="topo" className="relative overflow-hidden bg-[#F5F6F8]">
      <Blobs />
      {/* Grade sutil, mascarada ao redor do centro pra não competir com o texto */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,16,32,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(10,16,32,0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 78%)",
        }}
      />

      <div className="container-x relative pt-14 pb-20 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-[1.1fr_1fr] items-center gap-12 lg:gap-16">
          {/* Texto */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E4E8EE] px-3.5 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5A6474]">
              <span className="size-1.5 rounded-full bg-[#0E8A47] animate-pulse" />
              {eyebrow}
            </div>

            <h1 className="mt-6 text-[40px] sm:text-[54px] lg:text-[68px] font-bold leading-[1.03] tracking-[-0.03em] text-[#0A1020]">
              {title}{" "}
              {highlight && <span style={GRADIENT_TEXT}>{highlight}</span>}
            </h1>

            <p className="mt-6 max-w-xl text-[17px] lg:text-[19.5px] leading-relaxed text-[#4B5565]">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={primaryCTA.href}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white bg-[#0E8A47] hover:bg-[#0B7239] hover:-translate-y-px active:scale-[.98] transition-all duration-150"
                style={{ boxShadow: "0 10px 26px rgba(14,138,71,0.28)" }}
              >
                {primaryCTA.label} →
              </a>
              <a
                href={secondaryCTA.href}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-[#0A1020] bg-white border border-[#E4E7EC] hover:border-[#D2F0E0] hover:bg-[#EAF7F0] transition-all duration-150"
              >
                {secondaryCTA.label}
              </a>
            </div>

            <p className="mt-5 text-[13.5px] text-[#8A94A6]">
              7 dias de teste grátis · Configure em 5 minutos
            </p>

            <LiveCounter />
          </motion.div>

          <ProductMockup />
        </div>

        <SocialProofLogos />
      </div>
    </section>
  );
}

// Blobs decorativos — cor de marca em movimento lento, só atmosfera.
function Blobs() {
  const blobs = [
    { color: "rgba(14,138,71,0.20)", size: 520, top: "-12%", left: "-8%", drift: [0, 26, 0], dur: 18 },
    { color: "rgba(47,128,237,0.16)", size: 460, top: "35%", left: "72%", drift: [0, -30, 0], dur: 22 },
    { color: "rgba(109,59,234,0.12)", size: 380, top: "78%", left: "20%", drift: [0, 20, 0], dur: 26 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle at 50% 50%, ${b.color}, transparent 70%)`,
            filter: "blur(30px)",
          }}
          animate={{ y: b.drift, x: b.drift.map((v) => -v) }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function LiveCounter() {
  const avatars = [
    { c: "#0E8A47", l: "A" },
    { c: "#2F80ED", l: "B" },
    { c: "#6D3BEA", l: "C" },
    { c: "#25D366", l: "D" },
  ];
  return (
    <div className="mt-8 flex items-center gap-3 text-[14px]">
      <div className="flex -space-x-2">
        {avatars.map((a, i) => (
          <div
            key={i}
            className="size-8 rounded-full border-2 border-[#F5F6F8] flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: a.c }}
          >
            {a.l}
          </div>
        ))}
      </div>
      <div className="text-[#4B5565]">
        <span className="text-[#0E8A47] font-bold">27 operações</span> ativas agora na Wayvo
      </div>
    </div>
  );
}

// Roteiro do momento autoral: a IA fecha uma venda em tempo real.
const SCRIPT = [
  { at: 200, type: "bubble", side: "in", text: "Tem promoção hoje?" },
  { at: 1100, type: "typing", side: "out" },
  { at: 2400, type: "bubble", side: "out", text: "Oi Maria! 👋 Hoje só pra você: 40% off no kit completo. Garante o seu?" },
  { at: 3300, type: "bubble", side: "in", text: "Quero! Como pago?" },
  { at: 4200, type: "typing", side: "out" },
  { at: 5400, type: "bubble", side: "out", text: "Manda PIX pra wayvo@... Já reservei o último kit pro seu nome 🚀" },
  { at: 6300, type: "badge" },
];
const LOOP_PAUSE = 3200;

function ProductMockup() {
  const [step, setStep] = useState(0);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedRef.current) {
      setStep(SCRIPT.length);
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

    const el = document.getElementById("hero-chat-mockup");
    let io;
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(el);
    } else {
      run();
    }

    return () => { cancelled = true; timers.forEach(clearTimeout); io?.disconnect(); };
  }, []);

  const visible = SCRIPT.slice(0, step);
  const showTyping = visible.at(-1)?.type === "typing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative lg:min-h-[560px] flex items-center justify-center lg:block"
    >
      <div className="relative mx-auto w-[280px] sm:w-[300px] lg:mx-0 lg:ml-auto">
        {/* Halo claro atrás do aparelho */}
        <div
          className="absolute -inset-8 rounded-[3.5rem] pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 45%, rgba(14,138,71,0.14), transparent 68%)", filter: "blur(24px)" }}
        />

        <div id="hero-chat-mockup" className="relative rotate-1 hover:rotate-0 transition-transform duration-500">
          {/* Moldura do aparelho — clara, coerente com a seção */}
          <div
            className="relative rounded-[46px] p-[3px]"
            style={{
              background: "linear-gradient(160deg,#FFFFFF 0%,#D9DEE6 45%,#8A94A6 100%)",
              boxShadow: "0 30px 60px -20px rgba(10,16,32,0.28), 0 0 0 1px rgba(10,16,32,0.05)",
            }}
          >
            <div className="absolute -left-[3px] top-24 w-[3px] h-8 rounded-l bg-[#B6BECB]" />
            <div className="absolute -left-[3px] top-36 w-[3px] h-12 rounded-l bg-[#B6BECB]" />
            <div className="absolute -right-[3px] top-28 w-[3px] h-16 rounded-r bg-[#B6BECB]" />

            <div className="rounded-[43px] bg-[#0A1020] p-[7px]">
              {/* A tela mantém o skin escuro do WhatsApp de propósito: é um mockup realista */}
              <div className="relative rounded-[36px] overflow-hidden bg-[#0B141A]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0A1020] rounded-b-2xl z-30" />

                <div className="relative z-20 flex items-center justify-between px-6 pt-2.5 pb-1 text-white">
                  <span className="text-[12px] font-semibold">9:41</span>
                  <div className="flex items-center gap-1">
                    <Signal className="size-3" strokeWidth={2.5} />
                    <Wifi className="size-3" strokeWidth={2.5} />
                    <BatteryFull className="size-3.5" strokeWidth={2} />
                  </div>
                </div>

                <div className="relative z-20 flex items-center gap-2 px-3 py-2.5 bg-[#1F2C34]">
                  <ChevronLeft className="size-5 text-white/80 shrink-0" strokeWidth={2.5} />
                  <div className="size-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#0E8A47,#2F80ED)" }}>
                    MS
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white leading-tight truncate">Maria Silva</div>
                    <div className="text-[10.5px] text-[#25D366] leading-tight">online</div>
                  </div>
                  <div className="flex items-center gap-3 text-white/70 shrink-0">
                    <Video className="size-4" strokeWidth={2.25} />
                    <Phone className="size-3.5" strokeWidth={2.25} />
                    <MoreVertical className="size-4" strokeWidth={2.25} />
                  </div>
                </div>

                <div className="absolute top-[86px] right-3 z-20">
                  <div className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full bg-[#25D366]/15 border border-[#25D366]/35 text-[#25D366] font-semibold backdrop-blur-sm">
                    <Sparkles className="size-2.5" strokeWidth={2.25} />
                    IA ativa
                  </div>
                </div>

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
                        <div className="inline-flex items-center gap-1.5 text-[10px] text-[#25D366] bg-[#25D366]/15 border border-[#25D366]/35 px-3 py-1 rounded-full">
                          <Check className="size-3" strokeWidth={2.5} />
                          Convertido pela IA em 47s
                        </div>
                      </div>
                    ) : null
                  )}
                  {showTyping && <TypingIndicator />}
                </div>

                <div className="relative z-20 flex items-center gap-2 px-2.5 py-2 bg-[#1F2C34]">
                  <Plus className="size-5 text-white/60 shrink-0" strokeWidth={2.25} />
                  <div className="flex-1 h-8 rounded-full bg-white/[0.06] flex items-center px-3.5 text-[12px] text-white/35">
                    Mensagem
                  </div>
                  <div className="size-8 rounded-full bg-[#0E8A47] flex items-center justify-center shrink-0">
                    <Mic className="size-4 text-white" strokeWidth={2.25} />
                  </div>
                </div>

                <div className="relative z-20 flex justify-center py-2 bg-[#1F2C34]">
                  <div className="w-28 h-1 rounded-full bg-white/70" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards flutuantes — só onde há espaço lateral de verdade */}
        <div className="hidden lg:block absolute right-full mr-5 top-6 w-[186px] rounded-2xl bg-white border border-[#E9ECF1] p-3.5 z-30"
          style={{ boxShadow: "0 18px 36px -18px rgba(10,16,32,0.22)" }}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="size-9 rounded-full overflow-hidden ring-2 ring-[#D2F0E0] shrink-0">
              <img
                src="https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
                alt="Ana Clara"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[#0A1020] leading-tight truncate">Ana Clara</div>
              <div className="text-[10px] text-[#8A94A6] truncate">Loja de roupas · SP</div>
            </div>
          </div>
          <div className="text-[11px] text-[#3A4553] bg-[#EAFBF1] border border-[#D2F0E0] rounded-xl px-2.5 py-2 leading-relaxed">
            “Faturei R$ 8k em 3 dias só pelo Wayvo”
          </div>
        </div>

        <div className="hidden lg:block absolute right-full mr-5 bottom-10 w-[210px] rounded-2xl bg-white border border-[#E9ECF1] p-4 z-30"
          style={{ boxShadow: "0 18px 36px -18px rgba(10,16,32,0.22)" }}>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#EAFBF1] border border-[#D2F0E0] flex items-center justify-center text-[#0E8A47] shrink-0">
              <TrendingUp className="size-5" strokeWidth={2.25} />
            </div>
            <div>
              <div className="text-[11px] text-[#8A94A6] leading-tight">Receita atribuída hoje</div>
              <div className="text-[19px] font-bold text-[#0E8A47] leading-tight mt-0.5">+R$ 12.847</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Bubble({ side, children }) {
  const isOut = side === "out";
  return (
    <div
      className={`max-w-[82%] px-2.5 py-1.5 rounded-lg text-[13px] leading-snug shadow-sm animate-slide-up ${
        isOut ? "ml-auto bg-[#005C4B] text-white rounded-tr-sm" : "bg-[#202C33] text-white/90 rounded-tl-sm"
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
  const track = [...PARTNERS, ...PARTNERS];
  return (
    <div className="mt-16 lg:mt-20">
      <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#8A94A6] mb-6">
        Usado por 200+ negócios pelo Brasil
      </p>
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max items-center gap-4 animate-marquee">
          {track.map((p, i) => (
            <div
              key={`${p.file}-${i}`}
              className="group shrink-0 bg-white rounded-[18px] size-[92px] p-2 flex items-center justify-center border border-[#E9ECF1] hover:-translate-y-1 transition-all duration-300 ease-out"
              style={{ boxShadow: "0 6px 18px -10px rgba(10,16,32,0.18)" }}
            >
              <Image
                src={`/partners/${p.file}`}
                alt={p.name}
                width={92}
                height={92}
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
