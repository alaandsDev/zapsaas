// Tema light das telas internas do dashboard — ver "Wayvo Padrões Internos".
// Nenhuma cor nova deve ser inventada fora desta paleta.
export const DASH_ACCENT = {
  green: "#0E8A47",
  blue: "#2F80ED",
  violet: "#6D3BEA",
  amber: "#C2740A",
  red: "#C2434A",
  emerald: "#12A150",
  slate: "#5A6474",
};

// Cor de acento por tela (ícone de cabeçalho, badges de status, séries de gráfico —
// nunca no botão principal, que é sempre verde).
export const SCREEN_ACCENT = {
  conversas: DASH_ACCENT.green,
  leads: DASH_ACCENT.blue,
  crm: DASH_ACCENT.blue,
  vendas: DASH_ACCENT.green,
  campanhas: DASH_ACCENT.amber,
  sms: DASH_ACCENT.blue,
  "agente-ia": DASH_ACCENT.violet,
  canais: DASH_ACCENT.emerald,
  suporte: DASH_ACCENT.slate,
  equipe: DASH_ACCENT.slate,
};

// Badge: fundo cor+14 (8% alpha), borda cor+33 (20% alpha), texto na cor cheia.
export function dashBadge(color, { dot = true } = {}) {
  return {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 11px",
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: "nowrap",
      background: color + "14",
      border: `1px solid ${color}33`,
      color,
    },
    dotStyle: dot
      ? { width: 6, height: 6, borderRadius: 999, flexShrink: 0, background: color }
      : undefined,
  };
}

// Ícone de cabeçalho de página (quadrado suave com a cor de acento da tela).
export function dashHeaderIconStyle(color) {
  return {
    width: 32,
    height: 32,
    borderRadius: 11,
    background: color + "14",
    border: `1px solid ${color}33`,
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export function dashPillStyle(color, active) {
  return active
    ? { background: "#FFFFFF", color: "#0A1020", fontWeight: 600, boxShadow: "0 1px 2px rgba(10,16,32,.08)" }
    : { background: "transparent", color: "#6B7585" };
}

export function dashPageStyle(active, color = DASH_ACCENT.green) {
  return active
    ? { background: color, color: "#FFFFFF", fontWeight: 600, border: `1px solid ${color}` }
    : { background: "#FFFFFF", color: "#6B7585", border: "1px solid #E9ECF1" };
}
