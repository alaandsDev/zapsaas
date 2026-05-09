export default function Hero({
  eyebrow = "Sistema de Vendas Automáticas 24h",
  title,
  highlight,
  subtitle,
  primaryCTA = { label: "Começar agora", href: "/register" },
  secondaryCTA = { label: "Ver como funciona", href: "#como-funciona" },
  metrics,
}) {
  return (
    <section className="relative overflow-hidden">
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
              <div key={i} className="card p-5">
                <div className="text-2xl font-bold text-ink-100">{m.value}</div>
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
          27 negócios
        </span> ativaram disparos hoje
      </div>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent-blue/20 blur-2xl rounded-3xl" />
      <div className="relative card p-3 shadow-2xl shadow-primary/10 rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Header do "celular" */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent-blue" />
            <div>
              <div className="text-sm font-semibold">Maria Silva</div>
              <div className="text-[10px] text-primary">online</div>
            </div>
          </div>
          <div className="text-[10px] text-ink-500 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
            ⚡ Auto
          </div>
        </div>

        {/* Conversa */}
        <div className="space-y-2 p-3 min-h-[280px]">
          <Bubble side="in" delay="0">Tem promoção hoje?</Bubble>
          <Bubble side="out" delay=".4s">Oi Maria! 👋 Hoje só pra você: 40% off no kit completo. Garante o seu?</Bubble>
          <Bubble side="in" delay="1.2s">Quero! Como pago?</Bubble>
          <Bubble side="out" delay="1.6s">Manda PIX pra zapflow@... Já reservei o último kit pro seu nome 🚀</Bubble>
          <div className="flex justify-center mt-3 animate-fade-in" style={{ animationDelay: "2.2s" }}>
            <div className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              ✓ Venda fechada em 47s
            </div>
          </div>
        </div>
      </div>

      {/* Card flutuante de stats */}
      <div className="hidden lg:block absolute -left-8 bottom-8 card p-4 shadow-xl bg-bg/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            📈
          </div>
          <div>
            <div className="text-xs text-ink-400">Vendas hoje</div>
            <div className="text-xl font-bold text-primary">+R$ 12.847</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, children, delay }) {
  const isOut = side === "out";
  return (
    <div
      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm opacity-0 animate-fade-in ${
        isOut
          ? "ml-auto bg-primary/15 border border-primary/20 rounded-br-sm"
          : "bg-card2 border border-white/10 rounded-bl-sm"
      }`}
      style={{ animationDelay: delay, animationFillMode: "forwards" }}
    >
      {children}
    </div>
  );
}

function SocialProofLogos() {
  return (
    <div className="mt-16 lg:mt-20">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-ink-500 mb-6">
        Usado por 200+ negócios pelo Brasil
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all">
        {["SoftBeauty", "PizzaExpress", "OticaVista", "ImobMax", "BurgerKing+", "ClinicaDra", "DoceLar", "TechStore"].map((name) => (
          <div key={name} className="text-lg font-bold tracking-tight text-ink-200">
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
