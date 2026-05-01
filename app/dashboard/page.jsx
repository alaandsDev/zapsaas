"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "../../components/dashboard/Topbar";
import { Button } from "../../components/ui/Field";
import { api, getUser } from "../../lib/api";

const STAT_CARDS = [
  { key: "totalLeads", label: "Total de contatos", icon: "👥", color: "from-primary/20 to-primary/5" },
  { key: "totalDispatches", label: "Disparos realizados", icon: "⚡", color: "from-accent-blue/20 to-accent-blue/5" },
  { key: "messagesSent", label: "Mensagens enviadas", icon: "📨", color: "from-accent-purple/20 to-accent-purple/5" },
  { key: "responseRate", label: "Taxa de resposta", icon: "📈", color: "from-primary/20 to-primary/5", suffix: "%" },
];

export default function DashboardHome() {
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    api("/api/stats").then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Início" subtitle="Visão geral do seu sistema de vendas" />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="card p-6 lg:p-8 bg-gradient-to-br from-primary/[0.06] via-card to-card border-primary/20">
          <div className="text-sm text-primary font-medium">Bem-vindo de volta{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</div>
          <h2 className="text-2xl font-bold mt-2">Seu sistema de vendas está pronto pra trabalhar.</h2>
          <p className="text-ink-300 mt-2 max-w-xl">
            Conecte seu WhatsApp, importe seus contatos e dispare a primeira campanha em minutos.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/disparos"><Button>Criar primeiro disparo</Button></Link>
            <Link href="/dashboard/configuracoes"><Button variant="ghost">Conectar WhatsApp</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((c) => (
            <div key={c.key} className={`card p-5 bg-gradient-to-br ${c.color}`}>
              <div className="text-2xl">{c.icon}</div>
              <div className="text-xs text-ink-300 mt-3">{c.label}</div>
              <div className="text-2xl font-bold mt-1">
                {loading ? "—" : (stats[c.key] ?? 0)}{c.suffix || ""}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ActionCard
            href="/dashboard/disparos"
            icon="⚡"
            title="Criar um disparo"
            desc="Envie sua oferta para centenas de contatos de uma vez"
          />
          <ActionCard
            href="/dashboard/contatos"
            icon="👥"
            title="Importar contatos"
            desc="Cole sua lista e organize por tags em segundos"
          />
          <ActionCard
            href="/dashboard/automacao"
            icon="🤖"
            title="Configurar resposta automática"
            desc="Atenda seus clientes 24h sem precisar estar online"
          />
          <ActionCard
            href="/dashboard/configuracoes"
            icon="⚙️"
            title="Configurações da conta"
            desc="Conexão WhatsApp, plano e perfil"
          />
        </div>
      </div>
    </>
  );
}

function ActionCard({ href, icon, title, desc }) {
  return (
    <Link href={href} className="card p-5 hover:border-primary/30 hover:bg-card/80 transition-all group">
      <div className="flex items-start gap-4">
        <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold group-hover:text-primary transition-colors">{title}</div>
          <div className="text-sm text-ink-300 mt-1">{desc}</div>
        </div>
        <svg className="size-4 text-ink-500 group-hover:text-primary group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
