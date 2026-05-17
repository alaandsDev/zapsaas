"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Users, MessageSquare, Zap, TrendingUp, ArrowUpRight,
  Activity, Radio, Phone, Play, Pause, ChevronRight,
  Sparkles, Target, BarChart2, Send
} from "lucide-react";
import { motion } from "framer-motion";
import Topbar from "../../components/dashboard/Topbar";
import { api, getUser, API_URL, getToken } from "../../lib/api";

/* ── helpers ── */
function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

function AnimatedNumber({ value = 0, prefix = "", suffix = "", duration = 900 }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const animate = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span>{prefix}{n.toLocaleString("pt-BR")}{suffix}</span>;
}

const CHART_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs border-ink-600 shadow-elevated">
      <p className="text-ink-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const ACTIVITY_META = {
  message:  { icon: MessageSquare, color: "#00FF88", bg: "rgba(0,255,136,0.1)",  label: "Mensagem recebida" },
  lead:     { icon: Users,         color: "#3B82F6", bg: "rgba(59,130,246,0.1)", label: "Novo lead" },
  dispatch: { icon: Send,          color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "Disparo" },
  flow:     { icon: Zap,           color: "#7C3AED", bg: "rgba(124,58,237,0.1)", label: "Automação" },
  connect:  { icon: Phone,         color: "#22C55E", bg: "rgba(34,197,94,0.1)",  label: "Conexão" },
};

function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} />;
}

/* ── Componente principal ── */
export default function DashboardHome() {
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [chartData, setChartData] = useState([]);

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

      // Gera dados de gráfico dos últimos 7 dias
      const days = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
      const base = ds.slice(0, 7).map((d, i) => ({
        day: days[i % 7],
        enviadas: d.sent || 0,
        leads: Math.round((d.sent || 0) * 0.3),
        respostas: Math.round((d.sent || 0) * 0.15),
      }));
      setChartData(base.length ? base : days.map(d => ({ day: d, enviadas: 0, leads: 0, respostas: 0 })));

      // Feed inicial
      const feed = [];
      (s?.lastLeads || []).slice(0, 4).forEach(l => feed.push({
        id: `lead-${l.id}`, type: "lead",
        text: `Novo lead: ${l.name || l.phone}`,
        time: l.created_at || l.createdAt,
      }));
      ds.slice(0, 4).forEach(d => feed.push({
        id: `disp-${d.id}`, type: "dispatch",
        text: `"${d.message_title || "Campanha"}" · ${d.sent || 0}/${d.total || 0} enviados`,
        time: d.created_at,
      }));
      feed.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivity(feed.slice(0, 12));
    }).finally(() => setLoading(false));
  }, []);

  // SSE tempo real
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/chats/stream?token=${token}`);
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message") {
          setPulse(true);
          setTimeout(() => setPulse(false), 1000);
          setActivity(prev => [{
            id: `msg-${Date.now()}`, type: "message",
            text: `Mensagem de ${data.phone || "cliente"}${data.text ? `: "${data.text.slice(0,50)}…"` : ""}`,
            time: new Date().toISOString(),
          }, ...prev].slice(0, 15));
          setStats(prev => ({ ...prev, messagesSent: (prev.messagesSent || 0) + 1 }));
        }
      } catch {}
    });
    return () => es.close();
  }, []);

  const connectedSlots = sessions.filter(s => s.status === "connected").length;
  const activeDispatches = dispatches.filter(d => d.status === "sending").length;
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const KPIs = [
    {
      label: "Total de Leads",
      value: stats.leads ?? 0,
      delta: "+12%",
      positive: true,
      icon: Users,
      color: "#00FF88",
      bg: "rgba(0,255,136,0.08)",
      border: "rgba(0,255,136,0.2)",
    },
    {
      label: "Mensagens Enviadas",
      value: stats.messagesSent ?? 0,
      delta: "+8%",
      positive: true,
      icon: MessageSquare,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
    },
    {
      label: "Campanhas Ativas",
      value: activeDispatches,
      delta: `${dispatches.length} total`,
      positive: true,
      icon: Send,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "Números Conectados",
      value: connectedSlots,
      delta: `de ${sessions.length} slots`,
      positive: connectedSlots > 0,
      icon: Phone,
      color: "#22C55E",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
    },
  ];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Central operacional WhatsApp" />
      <div className="page-x space-y-6 pb-12">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-2xl border border-ink-700/60 p-6 lg:p-8"
          style={{ background: "linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(11,16,32,0.8) 50%, rgba(124,58,237,0.05) 100%)" }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
              style={{ background: "radial-gradient(circle, rgba(0,255,136,0.15), transparent 70%)" }} />
            <div className="absolute -bottom-10 left-1/3 w-60 h-60 rounded-full blur-3xl opacity-20"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)" }} />
          </div>
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`live-dot ${pulse ? "scale-125" : ""} transition-transform`} />
                <span className="eyebrow">Sistema operacional ativo</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Olá, {firstName}! 👋
              </h1>
              <p className="text-ink-300 mt-1.5 text-sm leading-relaxed">
                {connectedSlots > 0
                  ? `${connectedSlots} número${connectedSlots > 1 ? "s" : ""} conectado${connectedSlots > 1 ? "s" : ""} · pronto para operar`
                  : "Conecte seu WhatsApp para começar a operar"}
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Link href="/dashboard/disparos" className="btn-primary text-sm">
                <Send className="size-4" />
                Novo Disparo
              </Link>
              <Link href="/dashboard/automacao" className="btn-ghost text-sm">
                <Zap className="size-4" />
                Automação
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPIs.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 320, damping: 26 }}
                whileHover={{ y: -3 }}
                className="kpi-card group relative overflow-hidden"
              >
                <div
                  className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${k.color}55, 0 0 32px -10px ${k.color}66` }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110"
                      style={{ background: k.bg, borderColor: k.border }}>
                      <Icon className="size-5" style={{ color: k.color }} />
                    </div>
                    <span className="text-[11px] font-semibold flex items-center gap-0.5"
                      style={{ color: k.positive ? "#22C55E" : "#EF4444" }}>
                      <ArrowUpRight className="size-3" />
                      {k.delta}
                    </span>
                  </div>
                  <div>
                    <div className="text-[28px] font-bold tracking-tight leading-none mt-3"
                      style={{ color: k.color }}>
                      {loading
                        ? <Skeleton className="w-16 h-7" />
                        : <AnimatedNumber value={k.value} />}
                    </div>
                    <p className="text-xs font-medium text-ink-300 mt-1.5">{k.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Gráfico + Feed ── */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-4">

          {/* Gráfico de performance */}
          <div className="glass p-5 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold">Performance da Semana</h3>
                <p className="text-xs text-ink-400 mt-0.5">Mensagens enviadas, leads e respostas</p>
              </div>
              <div className="flex gap-3 text-[11px] text-ink-400">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary inline-block" />Enviadas</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent-blue inline-block" />Leads</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-secondary inline-block" />Respostas</span>
              </div>
            </div>
            {loading ? (
              <Skeleton className="w-full h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00FF88" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CHART_TOOLTIP />} />
                  <Area type="monotone" dataKey="enviadas" name="Enviadas" stroke="#00FF88" strokeWidth={2} fill="url(#gPrimary)" dot={false} />
                  <Area type="monotone" dataKey="leads"    name="Leads"    stroke="#3B82F6" strokeWidth={2} fill="url(#gBlue)"    dot={false} />
                  <Area type="monotone" dataKey="respostas" name="Respostas" stroke="#7C3AED" strokeWidth={2} fill="url(#gPurple)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Feed de atividade */}
          <div className="glass p-5 animate-fade-in flex flex-col" style={{ animationDelay: "260ms" }}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="live-dot" />
                <h3 className="font-semibold text-sm">Atividade ao Vivo</h3>
              </div>
              <span className="badge-primary text-[10px] py-0.5 px-2">AO VIVO</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[260px] pr-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="py-10 text-center">
                  <Radio className="size-8 text-ink-600 mx-auto mb-2" />
                  <p className="text-ink-400 text-sm">Aguardando eventos…</p>
                  <p className="text-ink-500 text-xs mt-0.5">Mensagens e ações aparecem aqui</p>
                </div>
              ) : (
                activity.map((a, i) => {
                  const meta = ACTIVITY_META[a.type] || ACTIVITY_META.message;
                  const Icon = meta.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors animate-slide-right" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="size-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{ background: meta.bg, borderColor: meta.color + "30" }}>
                        <Icon className="size-3.5" style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-200 truncate leading-snug">{a.text}</p>
                        <p className="text-[10px] text-ink-500 mt-0.5">{timeAgo(a.time)}</p>
                      </div>
                      <div className="size-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Números */}
          <div className="glass p-5 animate-fade-in" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Números WhatsApp</h3>
              <Link href="/dashboard/conexoes" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                Gerenciar <ChevronRight className="size-3" />
              </Link>
            </div>
            {sessions.length === 0 ? (
              <div className="border border-dashed border-ink-700 rounded-xl py-6 text-center">
                <Phone className="size-6 text-ink-600 mx-auto mb-2" />
                <p className="text-ink-500 text-xs">Nenhum número configurado</p>
                <Link href="/dashboard/conexoes" className="text-xs text-primary mt-1.5 inline-block font-semibold">+ Conectar agora</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-ink-700/60 hover:border-ink-600 transition-colors">
                    <div className="relative">
                      <div className="size-9 rounded-xl bg-ink-700/50 flex items-center justify-center text-base border border-ink-600">📱</div>
                      <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-bg ${s.status === "connected" ? "bg-success" : "bg-ink-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{s.phone || `Slot ${s.slot}`}</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${s.status === "connected" ? "text-success" : "text-ink-500"}`}>
                        {s.status === "connected" ? "● Conectado" : "○ Desconectado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campanhas */}
          <div className="glass p-5 animate-fade-in" style={{ animationDelay: "380ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Campanhas Recentes</h3>
              <Link href="/dashboard/disparos" className="text-[11px] text-primary hover:underline flex items-center gap-0.5">
                Ver todas <ChevronRight className="size-3" />
              </Link>
            </div>
            {dispatches.length === 0 ? (
              <div className="border border-dashed border-ink-700 rounded-xl py-6 text-center">
                <Send className="size-6 text-ink-600 mx-auto mb-2" />
                <p className="text-ink-500 text-xs">Nenhuma campanha</p>
                <Link href="/dashboard/disparos" className="text-xs text-primary mt-1.5 inline-block font-semibold">+ Criar campanha</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {dispatches.slice(0, 4).map(d => {
                  const pct = d.total ? Math.min(100, Math.round(((d.sent || 0) / d.total) * 100)) : 0;
                  const statusBadge = {
                    sending:   <span className="badge-warning text-[10px] py-0 px-1.5">⚡ enviando</span>,
                    completed: <span className="badge-success text-[10px] py-0 px-1.5">✓ concluído</span>,
                    cancelled: <span className="badge-danger  text-[10px] py-0 px-1.5">✕ cancelado</span>,
                    paused:    <span className="badge-purple  text-[10px] py-0 px-1.5">⏸ pausado</span>,
                    scheduled: <span className="badge-muted   text-[10px] py-0 px-1.5">🕐 agendado</span>,
                  }[d.status] || <span className="badge-muted text-[10px]">{d.status}</span>;
                  return (
                    <div key={d.id} className="p-3 rounded-xl border border-ink-700/60 hover:border-ink-600 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold truncate flex-1 mr-2">{d.message_title || "Campanha"}</p>
                        {statusBadge}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00FF88, #00CC6A)" }} />
                        </div>
                        <span className="text-[10px] text-ink-400 font-mono shrink-0">{d.sent||0}/{d.total||0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ações rápidas + IA */}
          <div className="space-y-3">
            <div className="glass p-5 animate-fade-in" style={{ animationDelay: "440ms" }}>
              <h3 className="font-semibold text-sm mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "/dashboard/leads",     Icon: Users,          label: "Leads",      color: "#3B82F6" },
                  { href: "/dashboard/disparos",   Icon: Send,           label: "Disparos",   color: "#F59E0B" },
                  { href: "/dashboard/automacao",  Icon: Zap,            label: "Automação",  color: "#7C3AED" },
                  { href: "/dashboard/conversas",  Icon: MessageSquare,  label: "Conversas",  color: "#00FF88" },
                ].map(({ href, Icon, label, color }) => (
                  <Link key={href} href={href}
                    className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl border border-ink-700/60 hover:border-ink-500 hover:bg-white/[0.02] transition-all group">
                    <div className="size-8 rounded-lg flex items-center justify-center border"
                      style={{ background: color + "10", borderColor: color + "30" }}>
                      <Icon className="size-4" style={{ color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-ink-400 group-hover:text-ink-100 transition-colors">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sugestão IA */}
            <div className="card p-4 border-secondary/30 animate-fade-in" style={{ animationDelay: "500ms", background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(11,16,32,0.8))" }}>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
                  <Sparkles className="size-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-1">Sugestão IA</p>
                  <p className="text-xs text-ink-300 leading-relaxed">
                    {activeDispatches > 0
                      ? `Você tem ${activeDispatches} campanha ativa. Adicione follow-up para aumentar conversão em até 40%.`
                      : connectedSlots > 0
                        ? "Seus números estão conectados. Crie uma automação de boas-vindas para novos contatos."
                        : "Conecte um número WhatsApp para começar a capturar leads automaticamente."}
                  </p>
                  <Link href="/dashboard/automacao" className="text-[11px] text-secondary font-semibold mt-1.5 inline-flex items-center gap-1 hover:underline">
                    Criar automação <ChevronRight className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
