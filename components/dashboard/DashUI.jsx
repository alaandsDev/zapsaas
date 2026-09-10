"use client";
// Biblioteca de componentes do tema light das telas internas — ver "Wayvo Padrões Internos".
// Usada por Conversas, Leads, CRM, Vendas, Campanhas, SMS, Agente de IA, Canais e Suporte/Equipe.
// Não usar nas demais telas do dashboard (ainda no tema escuro).
import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { dashBadge, dashHeaderIconStyle } from "./dashTheme";

export function DashButton({ variant = "primary", loading, children, className = "", ...props }) {
  const variants = {
    primary: "dash-btn-primary",
    secondary: "dash-btn-secondary",
    ghost: "dash-btn-ghost",
    danger: "dash-btn-danger",
  };
  return (
    <button {...props} disabled={props.disabled || loading} className={`${variants[variant] || variants.primary} ${className}`}>
      {loading && <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

export function DashIconButton({ children, className = "", ...props }) {
  return (
    <button {...props} className={`dash-icon-btn ${className}`}>
      {children}
    </button>
  );
}

export function DashBadge({ color, children, dot = true, className = "" }) {
  const b = dashBadge(color, { dot });
  return (
    <span style={b.style} className={className}>
      {dot && <span style={b.dotStyle} />}
      {children}
    </span>
  );
}

export function DashHeaderIcon({ icon: Icon, color }) {
  return (
    <span style={dashHeaderIconStyle(color)}>
      <Icon width={16} height={16} />
    </span>
  );
}

/** Cabeçalho padrão de tela interna: ícone+título+contagem, subtítulo, ações à direita. */
export function DashPageHeader({ icon, accent, title, count, subtitle, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-dash-border2">
      <div>
        <div className="flex items-center gap-2.5">
          {icon && <DashHeaderIcon icon={icon} color={accent} />}
          <h2 className="m-0 text-xl font-bold tracking-tight text-dash-ink">{title}</h2>
          {count != null && (
            <span className="font-mono text-[11px] text-dash-faint bg-dash-subtle border border-dash-border rounded-full px-2.5 py-0.5">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1.5 text-[13px] text-dash-faint">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      {children}
    </div>
  );
}

export function DashTh({ children, right }) {
  return <div className={`dash-th ${right ? "text-right" : ""}`}>{children}</div>;
}

export function DashEmptyState({ icon: Icon, accent = "#0E8A47", title, desc, cta, className = "" }) {
  return (
    <div className={`dash-empty ${className}`}>
      {Icon && (
        <span className="w-13 h-13 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ width: 52, height: 52, ...dashHeaderIconStyle(accent), borderRadius: 16 }}>
          <Icon width={24} height={24} />
        </span>
      )}
      <h3 className="m-0 text-base font-semibold text-dash-ink">{title}</h3>
      {desc && <p className="mx-auto mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-dash-faint">{desc}</p>}
      {cta && (
        <div className="mt-4">
          {cta.href ? (
            <Link href={cta.href} className="dash-btn-primary mx-auto">{cta.icon && <cta.icon width={15} height={15} />}{cta.label}</Link>
          ) : (
            <DashButton onClick={cta.onClick} className="mx-auto">{cta.icon && <cta.icon width={15} height={15} />}{cta.label}</DashButton>
          )}
        </div>
      )}
    </div>
  );
}

export function DashSkeletonBar({ w = "100%", h = "14px", className = "" }) {
  return <div className={`dash-skeleton ${className}`} style={{ width: w, height: h }} />;
}

export function DashSkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-t border-[#F1F3F6]">
      <div className="dash-skeleton !rounded-full" style={{ width: 34, height: 34 }} />
      <div className="flex-1 space-y-2">
        <DashSkeletonBar w="35%" h="12px" />
        <DashSkeletonBar w="50%" h="10px" />
      </div>
      {Array.from({ length: Math.max(0, cols - 2) }).map((_, i) => (
        <DashSkeletonBar key={i} w="64px" h="12px" />
      ))}
    </div>
  );
}

export function DashSkeletonList({ rows = 4, cols = 4 }) {
  return (
    <div className="dash-card-flush">
      {Array.from({ length: rows }).map((_, i) => <DashSkeletonRow key={i} cols={cols} />)}
    </div>
  );
}

export function DashSkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dash-card space-y-3">
          <DashSkeletonBar w="32px" h="32px" className="!rounded-xl" />
          <DashSkeletonBar w="66%" h="10px" />
          <DashSkeletonBar w="45%" h="24px" />
        </div>
      ))}
    </div>
  );
}

/** Modal/painel padrão das telas internas — fundo do overlay cinza claro, card branco central. */
export function DashModal({ open, onClose, title, subtitle, children, footer, size = "sm" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-[440px]", md: "max-w-xl", lg: "max-w-3xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dash-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} rounded-[22px] bg-white border border-[#E4E7EC] shadow-dash-modal max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-start justify-between gap-3 px-[22px] pt-5">
          <div>
            <h3 className="m-0 text-[17px] font-bold tracking-tight text-dash-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-[13px] text-dash-faint">{subtitle}</p>}
          </div>
          <DashIconButton onClick={onClose}><X width={15} height={15} /></DashIconButton>
        </div>
        <div className="px-[22px] py-[18px] flex flex-col gap-3.5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2.5 px-[22px] py-4 border-t border-dash-border2 bg-dash-subtle rounded-b-[22px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashToast({ icon: Icon, title, text, color }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] bg-white border border-dash-border shadow-dash-toast" style={{ borderLeft: `3px solid ${color}` }}>
      {Icon && (
        <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: color + "14", color }}>
          <Icon width={15} height={15} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-semibold text-dash-ink">{title}</span>
        {text && <span className="block text-xs text-dash-faint mt-0.5">{text}</span>}
      </span>
    </div>
  );
}
