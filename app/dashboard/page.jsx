"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "../../components/dashboard/Topbar";
import OnboardingChecklist from "../../components/dashboard/OnboardingChecklist";
import EmptyState from "../../components/dashboard/EmptyState";
import { SkeletonStats, SkeletonRow } from "../../components/dashboard/Skeleton";
import { api, getUser } from "../../lib/api";

const STAT_CARDS = [
  { key: "leads", label: "Total de Leads", sub: "Contatos capturados", color: "primary", icon: "👥" },
  { key: "newLeads", label: "Novos Leads", sub: "Aguardando contato", color: "blue", icon: "✨" },
  { key: "dispatches", label: "Disparos", sub: "Campanhas enviadas", color: "yellow", icon: "⚡" },
  { key: "messagesSent", label: "Mensagens Enviadas", sub: "Total de envios", color: "purple", icon: "📨" },
];

const COLORS = {
  primary: "from-primary/20 to-primary/5 text-primary",
  blue: "from-accent-blue/20 to-accent-blue/5 text-accent-blue",
  yellow: "from-yellow-500/20 to-yellow-500/5 text-yellow-300",
  purple: "from-accent-purple/20 to-accent-purple/5 text-accent-purple",
};

function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function DashboardHome() {
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    api("/api/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "";
  const recent = stats.lastLeads || [];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Visão geral da plataforma" />
      <div className="page-x space-y-6">
        <div className="card p-6 lg:p-8 bg-gradient-to-br from-primary/[0.06] via-card to-card border-primary/20">
          <h2 className="text-2xl font-bold">Olá, {firstName || "Admin"}! 👋</h2>
          <p className="text-ink-300 mt-2">Aqui está o resumo da sua plataforma hoje.</p>
        </div>

        <OnboardingChecklist />

        {loading ? <SkeletonStats count={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STAT_CARDS.map((c) => (
              <div key={c.key} className={`card p-5 bg-gradient-to-br ${COLORS[c.color]}`}>
                <div className="text-2xl">{c.icon}</div>
                <div className="text-xs text-ink-300 mt-3">{c.label}</div>
                <div className={`text-3xl font-bold mt-1 ${COLORS[c.color].split(" ").pop()}`}>
                  {stats[c.key] ?? 0}
                </div>
                <div className="text-xs text-ink-500 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Leads Recentes</h3>
              <Link href="/dashboard/leads" className="text-xs text-primary hover:underline">Ver todos →</Link>
            </div>
            {loading ? (
              <div className="space-y-1">{Array.from({length:4}).map((_,i)=><SkeletonRow key={i} cols={3}/>)}</div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon="🎯"
                title="Nenhum lead ainda"
                desc="Capture leads via formulário ou importe sua lista de contatos pra começar."
                cta={{ label: "Importar contatos", href: "/dashboard/leads" }}
                tip="Importações com 1.000 leads são limpas em 2 segundos"
              />
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {recent.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 py-2.5">
                    <div className={`size-2 rounded-full ${l.status === "new" ? "bg-primary" : l.status === "contacted" ? "bg-accent-blue" : "bg-yellow-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{l.name}</div>
                      <div className="text-xs text-ink-500 truncate">{l.phone}{l.interest ? ` · ${l.interest}` : ""}</div>
                    </div>
                    <div className="text-xs text-ink-500">{timeAgo(l.created_at || l.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <ActionRow href="/dashboard/leads" icon="➕" label="Adicionar Lead" />
              <ActionRow href="/dashboard/disparos" icon="🚀" label="Novo Disparo" />
              <ActionRow href="/dashboard/conexoes" icon="📱" label="Conectar WhatsApp" />
              <ActionRow href="/dashboard/leads" icon="📥" label="Importar Contatos" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionRow({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-sm"
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
