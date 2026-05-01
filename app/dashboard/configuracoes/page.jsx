"use client";
import { useEffect, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Button } from "../../../components/ui/Field";
import { api, getUser } from "../../../lib/api";

export default function Configuracoes() {
  const [tab, setTab] = useState("whatsapp");
  return (
    <>
      <Topbar title="Configurações" subtitle="Conexão, perfil e plano" />
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex gap-1 border-b border-white/[0.06] mb-6">
          {[
            { id: "whatsapp", label: "WhatsApp" },
            { id: "perfil", label: "Perfil" },
            { id: "plano", label: "Plano" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-ink-300 hover:text-ink-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "whatsapp" && <WhatsAppTab />}
        {tab === "perfil" && <PerfilTab />}
        {tab === "plano" && <PlanoTab />}
      </div>
    </>
  );
}

function WhatsAppTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  async function load() {
    try {
      const s = await api("/api/whatsapp/status");
      setStatus(s);
    } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, []);

  async function connect() {
    setConnecting(true);
    try { await api("/api/whatsapp/connect", { method: "POST" }); await load(); }
    catch (e) { alert(e.message); } finally { setConnecting(false); }
  }
  async function disconnect() {
    if (!confirm("Desconectar o WhatsApp?")) return;
    await api("/api/whatsapp/disconnect", { method: "POST" }); load();
  }

  const connected = status?.connected || status?.status === "connected";
  const qr = status?.qr || status?.qrCode;

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className={`size-12 rounded-xl flex items-center justify-center text-2xl ${connected ? "bg-primary/15 border border-primary/30" : "bg-white/5 border border-white/10"}`}>
            {connected ? "✓" : "📱"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">WhatsApp</h3>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${connected ? "bg-primary/15 text-primary border-primary/30" : "bg-white/5 text-ink-300 border-white/10"}`}>
                {loading ? "verificando..." : connected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <p className="text-sm text-ink-300 mt-1">
              {connected ? "Seu WhatsApp está conectado e pronto pra disparar." : "Conecte para começar a enviar mensagens automaticamente."}
            </p>
          </div>
          {connected ? (
            <Button variant="danger" onClick={disconnect}>Desconectar</Button>
          ) : (
            <Button onClick={connect} loading={connecting}>{qr ? "Atualizar QR" : "Conectar"}</Button>
          )}
        </div>

        {!connected && qr && (
          <div className="mt-6 pt-6 border-t border-white/[0.06] grid md:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="bg-white p-3 rounded-2xl">
              <img src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`} alt="QR Code" className="size-56 block" />
            </div>
            <ol className="text-sm text-ink-300 space-y-2 list-decimal list-inside">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em <strong className="text-ink-100">Mais opções</strong> ou <strong className="text-ink-100">Configurações</strong></li>
              <li>Toque em <strong className="text-ink-100">Aparelhos conectados</strong></li>
              <li>Toque em <strong className="text-ink-100">Conectar um aparelho</strong></li>
              <li>Aponte a câmera para este QR Code</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function PerfilTab() {
  const [user, setUser] = useState(null);
  useEffect(() => { setUser(getUser()); }, []);
  return (
    <div className="card p-6 space-y-4 max-w-lg">
      <Field label="Nome"><Input value={user?.name || ""} disabled /></Field>
      <Field label="E-mail"><Input value={user?.email || ""} disabled /></Field>
      <p className="text-xs text-ink-500">Para alterar dados de perfil, entre em contato com o suporte.</p>
    </div>
  );
}

function PlanoTab() {
  const [sub, setSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api("/api/subscription").then(setSub).catch(() => {});
    api("/api/usage").then(setUsage).catch(() => {});
  }, []);

  async function checkout() {
    setLoading(true);
    try {
      const r = await api("/api/stripe/checkout", { method: "POST", body: { plan: "pro" } });
      if (r?.url) location.href = r.url;
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }
  async function portal() {
    setLoading(true);
    try {
      const r = await api("/api/stripe/portal", { method: "POST" });
      if (r?.url) location.href = r.url;
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }

  const isPro = sub?.plan === "pro" || sub?.status === "active";
  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center">⚡</div>
          <div className="flex-1">
            <div className="text-sm text-ink-300">Plano atual</div>
            <div className="text-2xl font-bold">{isPro ? "Pro" : "Starter"}</div>
            <div className="text-sm text-ink-300 mt-1">
              {isPro ? "Disparos ilimitados · Suporte prioritário" : "Até 3 disparos · Para testar o sistema"}
            </div>
          </div>
          {isPro ? (
            <Button variant="ghost" loading={loading} onClick={portal}>Gerenciar plano</Button>
          ) : (
            <Button loading={loading} onClick={checkout}>Assinar Pro — R$ 47/mês</Button>
          )}
        </div>
        {usage && (
          <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-ink-500 text-xs">Disparos usados</div>
              <div className="font-semibold mt-1">{usage.dispatches_used ?? 0}{usage.dispatches_limit ? ` / ${usage.dispatches_limit}` : ""}</div>
            </div>
            <div>
              <div className="text-ink-500 text-xs">Mensagens enviadas</div>
              <div className="font-semibold mt-1">{usage.messages_sent ?? 0}</div>
            </div>
            <div>
              <div className="text-ink-500 text-xs">Próxima cobrança</div>
              <div className="font-semibold mt-1">{sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}</div>
            </div>
          </div>
        )}
      </div>
      {!isPro && (
        <div className="card p-6 bg-gradient-to-br from-primary/[0.06] to-card border-primary/20">
          <h3 className="font-semibold">Por que assinar o Pro?</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-100">
            <li className="flex gap-2"><span className="text-primary">✓</span> Disparos ilimitados</li>
            <li className="flex gap-2"><span className="text-primary">✓</span> Listas de contatos ilimitadas</li>
            <li className="flex gap-2"><span className="text-primary">✓</span> Suporte prioritário no WhatsApp</li>
            <li className="flex gap-2"><span className="text-primary">✓</span> Cancele quando quiser</li>
          </ul>
        </div>
      )}
    </div>
  );
}
