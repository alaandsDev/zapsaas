import Link from "next/link";

/**
 * EmptyState premium — usa SVG/emoji grande com glow, título forte, CTA primário,
 * opcional CTA secundário, e linha de "dica" com ícone.
 *
 * Props:
 * - icon: emoji ou ReactNode (default 📭)
 * - illustration: ReactNode (SVG custom — sobrepõe icon se passado)
 * - title, desc
 * - cta: { label, href } | { label, onClick } — botão primary
 * - secondary: { label, href } | { label, onClick } — botão ghost
 * - tip: string — texto pequeno embaixo
 * - action: ReactNode (legacy — fallback se não passar cta)
 */
export default function EmptyState({
  icon = "📭",
  illustration,
  title,
  desc,
  cta,
  secondary,
  tip,
  action,
  className = "",
}) {
  return (
    <div className={`card relative overflow-hidden ${className}`}>
      {/* Glow ambient */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-14 text-center">
        {illustration ? (
          <div className="mx-auto mb-6 flex justify-center">{illustration}</div>
        ) : (
          <div className="mx-auto mb-6 size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent-blue/10 border border-primary/20 flex items-center justify-center text-4xl">
            {icon}
          </div>
        )}

        <h3 className="font-bold text-xl text-ink-100">{title}</h3>
        {desc && (
          <p className="text-ink-300 mt-2 max-w-md mx-auto leading-relaxed">{desc}</p>
        )}

        {(cta || secondary || action) && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {cta && <CtaButton {...cta} variant="primary" />}
            {secondary && <CtaButton {...secondary} variant="ghost" />}
            {!cta && !secondary && action}
          </div>
        )}

        {tip && (
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-ink-400 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5">
            <span>💡</span>
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CtaButton({ label, href, onClick, variant }) {
  const cls =
    variant === "primary"
      ? "px-6 py-3 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 shadow-lg shadow-primary/20"
      : "px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-medium text-ink-100";
  if (href) return <Link href={href} className={cls}>{label}</Link>;
  return <button onClick={onClick} className={cls}>{label}</button>;
}
