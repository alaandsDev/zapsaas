"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Topbar from "../../components/dashboard/Topbar";
import { api, getUser, API_URL, getToken } from "../../lib/api";

function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value || 0;
    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);
  return <span>{display.toLocaleString("pt-BR")}</span>;
}

function MiniSparkline({ data = [], color = "#00ffb2" }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 72, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(" ");
  const id = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ACTIVITY_META = {
  message: { icon: "💬", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  lead:    { icon: "👤", bg: "bg-blue-500/10 border-blue-500/20",    dot: "bg-blue-400" },
  dispatch:{ icon: "🚀", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400" },
  flow:    { icon: "⚡", bg: "bg-purple-500/10 border-purple-500/20", dot: "bg-purple-400" },
};

export default function DashboardHome() {
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [pulse, setPulse] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "Admin";

  useEffect(() => {
    setUser(getUser());
    Promise.all([
      api("/api/stats").catch(() => ({})),
      api("/api/whatsapp/sessions").catch(() => []),
      api("/api/dispatches").catch(() => []),
    ]).then(([s, sess, disp]) => {
      setStats(s || {});
      setSessions(Array.isArray(sess) ? sess : []);
      const ds = Array.isArray(disp) ? disp : disp?.data || [];
      setDispatches(ds);
      const feed = [];
      (s?.lastLeads || []).slice(0, 3).forEach(l => feed.push({
        id: `lead-${l.id}`, type: "lead",
        text: `Novo lead: ${l.name || l.phone}`,
        time: l.created_at || l.createdAt,
      }));
      ds.slice(0, 3).forEach(d => feed.push({
        id: `disp-${d.id}`, type: "dispatch",
        text: `Disparo "${d.message_title || "Campanha"}" · ${d.sent || 0}/${d.total || 0} enviados`,
        time: d.created_at,
      }));
      feed.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivity(feed.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/chats/stream?token=${token}`);
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message") {
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
          setActivity(prev => [{
            id: `msg-${Date.now()}`, type: "message",
            text: `Mensagem de ${data.phone || "cliente"}${data.text ? `: "${data.text.slice(0,45)}${data.text.length > 45 ? "…" : ""}"` : ""}`,
            time: new Date().toISOString(),
          }, ...prev].slice(0, 12));
        }
      } catch {}
    });
    return () => es.close();
  }, []);

  const connectedSlots = sessions.filter(s => s.status === "connected").length;
  const activeDispatches = dispatches.filter(d => d.status === "sending").length;

  const CARDS = [
    { label: "Total de Leads", value: stats.leads, sub: "Contatos capturados", color: "#00ffb2", sparkData: [3,5,4,8,7,11,9],
      icon: <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/> },
    { label: "Mensagens Enviadas", value: stats.messagesSent, sub: "Total de envios", color: "#6366f1", sparkData: [5,8,6,12,10,15,13],
      icon: <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/> },
    { label: "Campanhas", value: stats.dispatches, sub: `${activeDispatches} ativa${activeDispatches !== 1 ? "s" : ""} agora`, color: "#f59e0b", sparkData: [1,2,1,3,2,4,3],
      icon: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/> },
    { label: "Números Ativos", value: connectedSlots, sub: `de ${sessions.length} configurados`, color: "#10b981", sparkData: [1,1,1,2,2,2,connectedSlots],
      icon: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.2 12.85a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/> },
  ];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Central de operações WhatsApp" />
      <div className="page-x space-y-5 pb-10">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 lg:p-8">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-8 left-1/3 w-48 h-48 bg-accent-purple/6 rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex size-2 rounded-full bg-primary transition-all duration-300 ${pulse ? "scale-150 shadow-[0_0_8px_#00ffb2]" : ""}`} />
                <span className="text-[11px] text-primary font-semibold tracking-widest uppercase">Sistema Ativo</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold">Olá, {firstName}! 👋</h2>
              <p className="text-ink-300 mt-1 text-sm">
                {connectedSlots > 0
                  ? `${connectedSlots} número${connectedSlots > 1 ? "s" : ""} conectado${connectedSlots > 1 ? "s" : ""} e pronto${connectedSlots > 1 ? "s" : ""} para operar`
                  : "Conecte seu WhatsApp para começar a operar"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/dashboard/disparos" className="px-4 py-2 rounded-xl bg-primary text-bg text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
                Novo Disparo
              </Link>
              <Link href="/dashboard/automacao" className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors flex items-center gap-2">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 0-8-3-8-8s3-8 8-8h6c5 0 8 3 8 8M7 11h2m6 0h2"/></svg>
                Automação
              </Link>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CARDS.map((c, i) => (
            <div key={i} className="card p-4 lg:p-5 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-200 cursor-default">
              <div className="flex items-start justify-between mb-4">
                <div className="size-9 rounded-xl flex items-center justify-center border" style={{ background: `${c.color}12`, borderColor: `${c.color}25`, color: c.color }}>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.icon}</svg>
                </div>
                <MiniSparkline data={c.sparkData} color={c.color} />
              </div>
              <div className="text-[28px] font-bold tracking-tight leading-none" style={{ color: c.color }}>
                {loading
                  ? <span className="inline-block w-14 h-7 bg-white/5 rounded-lg animate-pulse" />
                  : <AnimatedNumber value={c.value ?? 0} />}
              </div>
              <div className="text-xs font-semibold text-ink-200 mt-2">{c.label}</div>
              <div className="text-[11px] text-ink-500 mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-4">
          {/* Feed de atividade */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
                </span>
                <h3 className="font-semibold">Atividade em Tempo Real</h3>
              </div>
              <span className="text-[10px] font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-2.5 py-0.5">AO VIVO</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="size-9 rounded-xl bg-white/[0.04] shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-white/[0.04] rounded w-4/5" />
                      <div className="h-2.5 bg-white/[0.04] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3 opacity-50">📡</div>
                <p className="text-ink-400 text-sm font-medium">Aguardando atividade…</p>
                <p className="text-ink-500 text-xs mt-1">Mensagens, leads e eventos aparecem aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activity.map((a, i) => {
                  const meta = ACTIVITY_META[a.type] || ACTIVITY_META.message;
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-white/[0.015] rounded-xl px-1 transition-colors animate-fade-in">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 text-lg border ${meta.bg}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-200 truncate leading-snug">{a.text}</p>
                        <p className="text-[11px] text-ink-500 mt-0.5">{timeAgo(a.time)}</p>
                      </div>
                      <div className={`size-1.5 rounded-full shrink-0 ${meta.dot}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna direita */}
          <div className="space-y-4">
            {/* Números */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Números WhatsApp</h3>
                <Link href="/dashboard/conexoes" className="text-[11px] text-primary hover:underline">gerenciar →</Link>
              </div>
              {sessions.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                  <p className="text-ink-500 text-xs mb-2">Nenhum número configurado</p>
                  <Link href="/dashboard/conexoes" className="text-xs text-primary hover:underline font-medium">+ Conectar agora</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors">
                      <div className="relative">
                        <div className="size-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm">📱</div>
                        <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-card ${s.status === "connected" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{s.phone || `Slot ${s.slot}`}</p>
                        <p className={`text-[10px] mt-0.5 ${s.status === "connected" ? "text-emerald-500" : "text-ink-500"}`}>
                          {s.status === "connected" ? "● Conectado" : "○ Desconectado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disparos */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Campanhas Recentes</h3>
                <Link href="/dashboard/disparos" className="text-[11px] text-primary hover:underline">ver todas →</Link>
              </div>
              {dispatches.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                  <p className="text-ink-500 text-xs mb-2">Nenhuma campanha ainda</p>
                  <Link href="/dashboard/disparos" className="text-xs text-primary hover:underline font-medium">+ Criar campanha</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {dispatches.slice(0, 4).map(d => {
                    const pct = d.total ? Math.min(100, Math.round(((d.sent || 0) / d.total) * 100)) : 0;
                    const STATUS = { sending: ["⚡", "text-yellow-400"], completed: ["✓", "text-emerald-400"], cancelled: ["✕", "text-red-400"], paused: ["⏸", "text-blue-400"], scheduled: ["🕐", "text-ink-400"] };
                    const [sIcon, sColor] = STATUS[d.status] || ["·", "text-ink-500"];
                    return (
                      <div key={d.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold truncate flex-1 mr-2">{d.message_title || "Campanha"}</p>
                          <span className={`text-[10px] font-bold ${sColor}`}>{sIcon} {d.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent-blue rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-ink-500 shrink-0 font-mono">{d.sent||0}/{d.total||0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ações rápidas */}
            <div className="card p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/dashboard/leads", icon: "👥", label: "Leads" },
                  { href: "/dashboard/disparos", icon: "🚀", label: "Disparos" },
                  { href: "/dashboard/automacao", icon: "⚡", label: "Automação" },
                  { href: "/dashboard/conversas", icon: "💬", label: "Conversas" },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] hover:border-primary/30 hover:bg-primary/[0.04] transition-all group">
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-[11px] font-semibold text-ink-400 group-hover:text-ink-100 transition-colors">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
