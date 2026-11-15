"use client";
import { useEffect, useRef } from "react";

const TELEGRAM_URL = "https://t.me/+hnhwwm_Mki8xNGRh";

const FEATURES = [
  { tag: "TODO DIA", title: "PALPITES DIÁRIOS", desc: "Entradas liberadas todos os dias com mercado, horário e análise de cada uma." },
  { tag: "ODDS ALTAS", title: "TIPS PRECISOS", desc: "Seleções analisadas pela equipe, montadas e explicadas no grupo." },
  { tag: "DISCIPLINA", title: "GESTÃO DE BANCA", desc: "Quanto entrar em cada jogada, para o resultado não depender de sorte." },
];

const MARQUEE_ITEMS = [
  "PALPITES DIÁRIOS", "TIPS E ANÁLISES", "ACESSO GRÁTIS",
  "ODDS ALTAS", "GESTÃO DE BANCA", "CONEXÃO GREEN",
];

export default function LinkTelegram() {
  const handleJoin = () => { window.open(TELEGRAM_URL, "_blank", "noopener"); };

  return (
    <div style={{ minHeight: "100vh", background: "#080d08", color: "#fff", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 24px 4px #22c55e88; } 50% { box-shadow: 0 0 48px 12px #22c55ecc; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .btn-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .logo-float { animation: float 4s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.7s ease both; }
        .btn-telegram {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff; font-weight: 900; font-size: 1.05rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 1rem 2.8rem; border-radius: 50px;
          border: none; cursor: pointer; width: 100%; max-width: 380px;
          transition: transform 0.15s, opacity 0.15s;
        }
        .btn-telegram:hover { transform: scale(1.03); opacity: 0.95; }
        .btn-telegram:active { transform: scale(0.98); }
        .feature-card {
          display: flex; gap: 14px; align-items: flex-start;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(34,197,94,0.15);
          border-radius: 14px; padding: 16px 18px;
        }
        .badge {
          display: inline-block; background: rgba(34,197,94,0.15);
          border: 1px solid rgba(34,197,94,0.4); color: #22c55e;
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 3px 10px; border-radius: 50px;
        }
      `}</style>

      {/* Glow bg */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,197,94,0.18) 0%, transparent 70%)" }} />

      {/* Marquee ticker */}
      <div style={{ background: "rgba(34,197,94,0.1)", borderBottom: "1px solid rgba(34,197,94,0.2)",
        padding: "8px 0", overflow: "hidden", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", animation: "marquee 18s linear infinite", width: "max-content" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ padding: "0 24px", fontSize: "0.7rem", fontWeight: 800,
              letterSpacing: "0.12em", color: "#22c55e", whiteSpace: "nowrap" }}>
              ✦ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", padding: "48px 20px 32px", maxWidth: 480, margin: "0 auto" }}>

        {/* Logo */}
        <div className="logo-float fade-in" style={{ animationDelay: "0s", marginBottom: 24 }}>
          <img src="/conexao-green-logo.png" alt="Conexão Green"
            style={{ width: 160, height: 160, borderRadius: "50%", objectFit: "cover",
              border: "3px solid rgba(34,197,94,0.5)",
              boxShadow: "0 0 40px 8px rgba(34,197,94,0.3)" }} />
        </div>

        {/* Brand */}
        <div className="fade-in" style={{ animationDelay: "0.1s", textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "0.04em", lineHeight: 1.1 }}>
            CONEXÃO <span style={{ color: "#22c55e" }}>GREEN</span>
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.14em",
            color: "#6b7280", textTransform: "uppercase", marginTop: 4 }}>
            DICAS E PALPITES ESPORTIVOS
          </div>
        </div>

        {/* Official badge */}
        <div className="fade-in" style={{ animationDelay: "0.15s", margin: "16px 0" }}>
          <span className="badge">⚡ GRUPO OFICIAL NO TELEGRAM</span>
        </div>

        {/* Headline */}
        <div className="fade-in" style={{ animationDelay: "0.2s", textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em",
            textTransform: "uppercase", lineHeight: 1.2 }}>
            PALPITES DIÁRIOS
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.04em",
            color: "#22c55e", textTransform: "uppercase", lineHeight: 1.2 }}>
            TIPS E ANÁLISES
          </div>
        </div>

        {/* CTA Button */}
        <div className="fade-in" style={{ animationDelay: "0.25s", width: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <button className="btn-telegram btn-glow" onClick={handleJoin}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            ENTRAR GRÁTIS
          </button>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            Abre direto no seu Telegram, sem sair do celular.
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.08)", margin: "36px 0" }} />

        {/* Features */}
        <div className="fade-in" style={{ animationDelay: "0.3s", width: "100%", display: "flex",
          flexDirection: "column", gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#22c55e", fontSize: "1rem" }}>✦</span>
              </div>
              <div>
                <div style={{ fontSize: "0.6rem", color: "#22c55e", fontWeight: 800,
                  letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>
                  {f.tag}
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: "0.04em",
                  textTransform: "uppercase" }}>{f.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: 2, lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Second CTA */}
        <div className="fade-in" style={{ animationDelay: "0.4s", width: "100%",
          background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 18, padding: "28px 20px", marginTop: 36, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, textTransform: "uppercase",
            letterSpacing: "0.04em" }}>
            O PRÓXIMO PALPITE SAI HOJE
          </div>
          <div style={{ fontSize: "0.82rem", color: "#9ca3af", margin: "8px 0 20px" }}>
            Entre pelo botão e receba no Telegram assim que sair.
          </div>
          <button className="btn-telegram" onClick={handleJoin} style={{ margin: "0 auto" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            QUERO ENTRAR AGORA
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, fontSize: "0.7rem", color: "#4b5563", textAlign: "center" }}>
          18+ • Conteúdo informativo. Jogue com responsabilidade.
        </div>
      </div>
    </div>
  );
}
