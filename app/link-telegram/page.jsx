"use client";

const TELEGRAM_URL = "https://t.me/+hnhwwm_Mki8xNGRh";

const FEATURES = [
  { tag: "TODO DIA", title: "PALPITES DIÁRIOS", desc: "Entradas liberadas todos os dias com mercado, horário e análise de cada uma.", icon: "📅" },
  { tag: "ODDS ALTAS", title: "TIPS PRECISOS", desc: "Seleções analisadas pela equipe, montadas e explicadas no grupo.", icon: "📊" },
  { tag: "DISCIPLINA", title: "GESTÃO DE BANCA", desc: "Quanto entrar em cada jogada, para o resultado não depender de sorte.", icon: "💰" },
];

const MARQUEE_ITEMS = ["PALPITES DIÁRIOS","TIPS E ANÁLISES","ACESSO GRÁTIS","ODDS ALTAS","GESTÃO DE BANCA","CONEXÃO GREEN","ACESSO ANTECIPADO"];

export default function LinkTelegram() {
  const handleJoin = () => window.open(TELEGRAM_URL, "_blank", "noopener");

  return (
    <div style={{ minHeight:"100vh", background:"#060b06", color:"#fff", fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;0,900;1,800;1,900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 30px 6px #22c55e99,0 0 60px 10px #22c55e44}50%{box-shadow:0 0 60px 16px #22c55ecc,0 0 100px 24px #22c55e66}}
        @keyframes live-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        .logo-wrap{animation:float 4s ease-in-out infinite}
        .btn-main{
          display:flex;align-items:center;justify-content:center;gap:12px;
          background:linear-gradient(135deg,#4ade80 0%,#22c55e 40%,#16a34a 100%);
          color:#fff;font-weight:900;font-size:1.15rem;letter-spacing:0.1em;
          text-transform:uppercase;padding:1.1rem 2rem;border-radius:14px;
          border:none;cursor:pointer;width:100%;max-width:420px;
          box-shadow:0 4px 32px rgba(34,197,94,0.5),0 1px 0 rgba(255,255,255,0.2) inset;
          transition:transform 0.15s,box-shadow 0.15s;
          animation:pulse-glow 2.5s ease-in-out infinite;
        }
        .btn-main:hover{transform:scale(1.02);box-shadow:0 6px 48px rgba(34,197,94,0.7)}
        .btn-main:active{transform:scale(0.98)}
        .btn-second{
          display:flex;align-items:center;justify-content:center;gap:10px;
          background:transparent;border:2px solid #22c55e;color:#22c55e;
          font-weight:900;font-size:1rem;letter-spacing:0.08em;text-transform:uppercase;
          padding:0.9rem 2rem;border-radius:14px;cursor:pointer;
          width:100%;max-width:420px;transition:all 0.2s;
        }
        .btn-second:hover{background:rgba(34,197,94,0.1);box-shadow:0 0 24px rgba(34,197,94,0.3)}
        .live-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:live-dot 1.2s ease infinite}
        .fade-up{animation:fadeUp 0.6s ease both}
        .feature-card{
          display:flex;gap:16px;align-items:flex-start;
          background:rgba(34,197,94,0.05);
          border:1px solid rgba(34,197,94,0.18);
          border-radius:16px;padding:18px 20px;
          transition:border-color 0.2s;
        }
        .feature-card:hover{border-color:rgba(34,197,94,0.4)}
      `}</style>

      {/* Background layers */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        background:"radial-gradient(ellipse 100% 60% at 50% -5%,rgba(34,197,94,0.22) 0%,transparent 65%)"}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        background:"radial-gradient(ellipse 60% 40% at 50% 100%,rgba(34,197,94,0.1) 0%,transparent 70%)"}}/>
      {/* Subtle grid texture */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:0.03,
        backgroundImage:"linear-gradient(rgba(34,197,94,1) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,1) 1px,transparent 1px)",
        backgroundSize:"40px 40px"}}/>

      {/* Marquee */}
      <div style={{position:"relative",zIndex:1,background:"rgba(34,197,94,0.12)",
        borderBottom:"1px solid rgba(34,197,94,0.25)",padding:"9px 0",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"marquee 20s linear infinite",width:"max-content"}}>
          {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i)=>(
            <span key={i} style={{padding:"0 28px",fontSize:"0.68rem",fontWeight:800,
              letterSpacing:"0.14em",color:"#4ade80",whiteSpace:"nowrap"}}>
              ✦ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",
        alignItems:"center",padding:"52px 20px 40px",maxWidth:500,margin:"0 auto"}}>

        {/* Logo */}
        <div className="logo-wrap fade-up" style={{animationDelay:"0s",marginBottom:20}}>
          <div style={{position:"relative",width:200,height:200}}>
            {/* Outer glow ring */}
            <div style={{position:"absolute",inset:-8,borderRadius:"50%",
              background:"conic-gradient(from 0deg,#22c55e,#4ade80,#166534,#22c55e)",
              animation:"pulse-glow 2.5s ease-in-out infinite",opacity:0.6}}/>
            <div style={{position:"absolute",inset:-4,borderRadius:"50%",background:"#060b06"}}/>
            <img src="/conexao-green-logo.png" alt="Conexão Green"
              style={{position:"relative",zIndex:1,width:"100%",height:"100%",
                borderRadius:"50%",objectFit:"cover",
                border:"3px solid rgba(34,197,94,0.6)"}}/>
          </div>
        </div>

        {/* Live badge */}
        <div className="fade-up" style={{animationDelay:"0.1s",marginBottom:16,
          display:"flex",alignItems:"center",gap:8,
          background:"rgba(0,0,0,0.5)",border:"1px solid rgba(34,197,94,0.4)",
          borderRadius:50,padding:"5px 16px"}}>
          <div className="live-dot"/>
          <span style={{fontSize:"0.72rem",fontWeight:800,letterSpacing:"0.12em",color:"#4ade80"}}>
            AO VIVO HOJE
          </span>
        </div>

        {/* Title */}
        <div className="fade-up" style={{animationDelay:"0.15s",textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:"2.2rem",fontWeight:900,letterSpacing:"0.02em",lineHeight:1,
            textShadow:"0 2px 20px rgba(0,0,0,0.8)"}}>
            CONEXÃO <span style={{color:"#4ade80",fontStyle:"italic"}}>GREEN</span>
          </div>
          <div style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.18em",
            color:"#4b5563",textTransform:"uppercase",marginTop:6}}>
            DICAS E PALPITES ESPORTIVOS
          </div>
        </div>

        {/* Official badge */}
        <div className="fade-up" style={{animationDelay:"0.2s",margin:"14px 0 24px",
          background:"rgba(0,0,0,0.4)",border:"1px solid rgba(34,197,94,0.35)",
          borderRadius:50,padding:"6px 18px"}}>
          <span style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.12em",color:"#86efac"}}>
            ⚡ GRUPO OFICIAL NO TELEGRAM
          </span>
        </div>

        {/* Headline */}
        <div className="fade-up" style={{animationDelay:"0.25s",textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:"1.75rem",fontWeight:900,letterSpacing:"0.03em",
            textTransform:"uppercase",lineHeight:1.15,
            textShadow:"0 2px 20px rgba(0,0,0,0.6)"}}>
            PALPITES DIÁRIOS
          </div>
          <div style={{fontSize:"1.75rem",fontWeight:900,fontStyle:"italic",
            letterSpacing:"0.03em",color:"#4ade80",textTransform:"uppercase",
            lineHeight:1.15,textShadow:"0 0 30px rgba(74,222,128,0.4)"}}>
            TIPS E ANÁLISES
          </div>
        </div>

        {/* CTA */}
        <div className="fade-up" style={{animationDelay:"0.3s",width:"100%",
          display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <button className="btn-main" onClick={handleJoin}>
            <TelegramIcon size={24}/>
            ENTRAR GRÁTIS
          </button>
          <div style={{fontSize:"0.75rem",color:"#6b7280"}}>
            Abre direto no seu Telegram, sem sair do celular.
          </div>
        </div>

        {/* Divider */}
        <div style={{width:"100%",height:1,
          background:"linear-gradient(90deg,transparent,rgba(34,197,94,0.3),transparent)",
          margin:"40px 0"}}/>

        {/* Features */}
        <div className="fade-up" style={{animationDelay:"0.35s",width:"100%",
          display:"flex",flexDirection:"column",gap:12}}>
          {FEATURES.map((f,i)=>(
            <div key={i} className="feature-card">
              <div style={{width:44,height:44,borderRadius:12,flexShrink:0,
                background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem"}}>
                {f.icon}
              </div>
              <div>
                <div style={{fontSize:"0.6rem",color:"#4ade80",fontWeight:800,
                  letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3}}>
                  {f.tag}
                </div>
                <div style={{fontSize:"0.95rem",fontWeight:800,letterSpacing:"0.03em",
                  textTransform:"uppercase"}}>{f.title}</div>
                <div style={{fontSize:"0.8rem",color:"#9ca3af",marginTop:3,lineHeight:1.5}}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Second CTA block */}
        <div className="fade-up" style={{animationDelay:"0.4s",width:"100%",
          background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(22,101,52,0.08))",
          border:"1px solid rgba(34,197,94,0.25)",
          borderRadius:20,padding:"32px 24px",marginTop:40,textAlign:"center"}}>
          <div style={{fontSize:"0.65rem",color:"#4ade80",fontWeight:800,
            letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
            NÃO PERCA
          </div>
          <div style={{fontSize:"1.3rem",fontWeight:900,textTransform:"uppercase",
            letterSpacing:"0.03em",lineHeight:1.2}}>
            O PRÓXIMO PALPITE<br/>
            <span style={{color:"#4ade80",fontStyle:"italic"}}>SAI HOJE</span>
          </div>
          <div style={{fontSize:"0.82rem",color:"#6b7280",margin:"12px 0 24px",lineHeight:1.5}}>
            Entre pelo botão e receba no Telegram assim que sair.
          </div>
          <button className="btn-second" onClick={handleJoin} style={{margin:"0 auto"}}>
            <TelegramIcon size={20}/>
            QUERO ENTRAR AGORA
          </button>
        </div>

        {/* Footer */}
        <div style={{marginTop:36,fontSize:"0.68rem",color:"#374151",textAlign:"center",lineHeight:1.6}}>
          18+ • Conteúdo informativo. Jogue com responsabilidade.
        </div>
      </div>
    </div>
  );
}

function TelegramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
    </svg>
  );
}
