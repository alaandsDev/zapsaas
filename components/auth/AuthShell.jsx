import Link from "next/link";
import Logo from "../Logo";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── LEFT: formulário ── */}
      <div className="flex flex-col justify-between w-full lg:w-1/2 px-8 py-10 bg-white min-h-screen">
        <div className="flex justify-center lg:justify-start">
          <Link href="/" aria-label="ZapFlow">
            <div className="flex items-center gap-2.5">
              <div
                className="rounded-xl flex items-center justify-center font-bold"
                style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg, #00FFB2 0%, #00DFA2 100%)",
                  boxShadow: "0 4px 14px -4px rgba(0,255,178,0.55)",
                }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#0B0F14" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-gray-900">ZapFlow</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title} 👋</h1>
          {subtitle && <p className="text-gray-500 text-sm mb-7">{subtitle}</p>}

          {/* form fields com estilo light */}
          <style>{`
            .auth-field label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
            .auth-field input {
              width:100%; padding:11px 14px 11px 38px;
              background:#fff; border:1.5px solid #E5E7EB;
              border-radius:10px; color:#111827; font-size:14px;
              outline:none; transition:border-color .2s, box-shadow .2s;
              font-family:inherit;
            }
            .auth-field input:focus { border-color:#00DFA2; box-shadow:0 0 0 3px rgba(0,223,162,0.12); }
            .auth-field .input-wrap { position:relative; }
            .auth-field .input-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#9CA3AF; font-size:15px; pointer-events:none; }
            .auth-btn {
              width:100%; padding:13px; background:#00DFA2; color:#0B0F14;
              border:none; border-radius:10px; font-size:15px; font-weight:700;
              cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px;
              font-family:inherit;
            }
            .auth-btn:hover { background:#00c990; transform:translateY(-1px); }
            .auth-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
            .auth-security { display:flex; align-items:center; gap:8px; background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:10px 14px; font-size:12px; color:#15803D; margin-top:12px; }
            .auth-err { background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:10px 14px; font-size:13px; color:#DC2626; margin-bottom:12px; }
          `}</style>

          <div className="space-y-4 [&_.auth-field]:block">
            {children}
          </div>

          <div className="auth-security">
            <span>🛡️</span>
            <span>Os seus dados estão protegidos com criptografia de ponta a ponta.</span>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          {footer}
          <p className="mt-4 text-xs text-gray-400">© 2025 • PLATAFORMA SEGURA E CONFIÁVEL</p>
        </div>
      </div>

      {/* ── RIGHT: marketing ── */}
      <div className="hidden lg:flex flex-col justify-center items-start w-1/2 px-16 relative overflow-hidden min-h-screen"
        style={{ background: "linear-gradient(145deg, #0B0F14 0%, #0d1f18 50%, #0a1a1a 100%)" }}>

        {/* glow */}
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,255,178,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,255,178,0.06) 0%, transparent 70%)" }} />


        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Automatize o seu WhatsApp<br/>
            e <span style={{ color: "#00DFA2" }}>escale as suas vendas.</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            Transforme mensagens em receitas com a plataforma completa de Disparos, Chatbot e Leads. Tudo o que precisa para vender mais e melhor.
          </p>

          {/* stats */}
          <div className="flex gap-8">
            {[
              { val: "500+", label: "negócios ativos" },
              { val: "2M+", label: "msgs enviadas" },
              { val: "R$47", label: "plano completo" },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold" style={{ color: "#00DFA2" }}>{s.val}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
