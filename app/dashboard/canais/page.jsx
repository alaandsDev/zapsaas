"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw, MessageCircle, Hourglass, Send } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import { DashButton, DashBadge } from "../../../components/dashboard/DashUI";
import { dashHeaderIconStyle, DASH_ACCENT } from "../../../components/dashboard/dashTheme";

const MAX_SLOTS = 2;
const EMERALD = DASH_ACCENT.emerald; // #12A150 — acento exclusivo da tela Canais

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-dash-ink2 mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-dash-faint mt-1.5">{hint}</span>}
      {error && <span className="block text-xs text-dash-red mt-1.5">{error}</span>}
    </label>
  );
}

/** Dot de status com animação de pulso — cor reflete o estado da conexão (dado dinâmico). */
function PulseDot({ color, pulse }) {
  return (
    <span className="relative inline-flex size-2.5 shrink-0">
      {pulse && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
      )}
      <span className="relative inline-flex rounded-full size-2.5" style={{ background: color }} />
    </span>
  );
}

export default function Conexoes() {
  const [sessions, setSessions] = useState([
    { slot: 1, status: "disconnected", qr: null, phone: null },
    { slot: 2, status: "disconnected", qr: null, phone: null },
  ]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api("/api/whatsapp/sessions");
      if (Array.isArray(data)) setSessions(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(refresh, 5000);
  }
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => {
    refresh();
    startPoll();
    return () => stopPoll();
  }, []);

  // Eventos de conexão via event bus global (NotificationProvider gerencia o SSE)
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      setSessions((prev) => prev.map((s) =>
        s.slot === d.slot
          ? { ...s, status: d.status, qr: d.qr ?? (d.status === "connected" ? null : s.qr), phone: d.phone ?? s.phone }
          : s
      ));
      // Re-busca completa após poucos ms para garantir consistência
      if (d.status === "connected" || d.status === "disconnected") {
        setTimeout(refresh, 400);
      }
    };
    window.addEventListener("wayvo:connection-update", handler);
    return () => window.removeEventListener("wayvo:connection-update", handler);
  }, [refresh]);

  // Mantém polling enquanto houver sessão em transição (connecting, qr_ready, reconnecting)
  useEffect(() => {
    const hasPending = sessions.some(s => ["connecting", "qr_ready", "reconnecting"].includes(s.status));
    if (!hasPending) stopPoll();
    else startPoll();
  }, [sessions]);

  async function connect(slot) {
    setSessions(prev => prev.map(s => s.slot === slot ? { ...s, status: "connecting" } : s));
    try {
      await api(`/api/whatsapp/sessions/${slot}/connect`, { method: "POST" });
      await refresh();
      startPoll();
    } catch (e) {
      alert(e.message || "Erro ao conectar");
      setSessions(prev => prev.map(s => s.slot === slot ? { ...s, status: "disconnected" } : s));
    }
  }

  async function disconnect(slot) {
    if (!confirm(`Desconectar o número ${slot}? Precisará escanear o QR novamente.`)) return;
    try {
      await api(`/api/whatsapp/sessions/${slot}/disconnect`, { method: "POST" });
      setSessions(prev => prev.map(s => s.slot === slot ? { ...s, status: "disconnected", qr: null, phone: null } : s));
    } catch (e) { alert(e.message); }
  }

  const connectedCount = sessions.filter(s => s.status === "connected").length;

  return (
    <>
      <Topbar title="Conexões" subtitle="Conecte até 2 números para disparos com round-robin anti-ban" />
      <div className="page-x space-y-6">

        {/* Info banner */}
        {connectedCount > 1 && (
          <div className="rounded-xl bg-dash-green/10 border border-dash-green/25 px-5 py-4 flex items-center gap-3 text-sm">
            <span className="text-xl">🔄</span>
            <div>
              <span className="font-semibold text-dash-green">Round-robin ativo!</span>
              <span className="text-dash-muted ml-2">Os disparos vão alternar entre {connectedCount} números — 1 mensagem por número por vez, reduzindo risco de ban.</span>
            </div>
          </div>
        )}
        {connectedCount === 1 && (
          <div className="rounded-xl bg-dash-blue/10 border border-dash-blue/20 px-5 py-4 flex items-center gap-3 text-sm">
            <span className="text-xl">💡</span>
            <div>
              <span className="font-semibold" style={{ color: DASH_ACCENT.blue }}>Dica:</span>
              <span className="text-dash-muted ml-2">Conecte um segundo número para ativar o round-robin e enviar com mais segurança.</span>
            </div>
          </div>
        )}

        {/* Session cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {sessions.map((session) => (
            <SessionCard
              key={session.slot}
              session={session}
              loading={loading}
              onConnect={() => connect(session.slot)}
              onDisconnect={() => disconnect(session.slot)}
              onRefresh={refresh}
            />
          ))}
        </div>

        {/* Test send */}
        <TestSendCard sessions={sessions} />
      </div>
    </>
  );
}

function SessionCard({ session, loading, onConnect, onDisconnect, onRefresh }) {
  const { slot, status, qr, phone } = session;
  const isConnected = status === "connected";
  const hasQR = status === "qr_ready" && qr;
  const isConnecting = status === "connecting";
  const isReconnecting = status === "reconnecting";

  return (
    <div className="dash-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={isConnected ? { background: `${EMERALD}1F`, color: EMERALD } : { background: "#F3F4F7", color: "#8A94A6" }}>
            {slot}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-dash-ink">Número {slot}</h3>
            <p className="text-xs text-dash-faint">{isConnected ? `+${phone}` : "Não conectado"}</p>
          </div>
        </div>
        <StatusBadge status={status} loading={loading} />
      </div>

      <div className="flex flex-col items-center py-4">
        {isConnected ? (
          <>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm text-dash-muted mb-1">WhatsApp conectado</p>
            <div className="mt-2 px-4 py-2 rounded-xl font-bold text-lg" style={{ background: `${EMERALD}14`, border: `1px solid ${EMERALD}33`, color: EMERALD }}>
              +{phone}
            </div>
            <div className="mt-5">
              <DashButton variant="danger" onClick={onDisconnect}>Desconectar</DashButton>
            </div>
          </>
        ) : hasQR ? (
          <>
            <div className="bg-white p-2.5 rounded-xl border-2 mb-3" style={{ borderColor: `${EMERALD}4D` }}>
              <img
                src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`}
                alt="QR Code"
                className="size-52 block"
              />
            </div>
            <p className="text-xs text-dash-faint mb-3">QR expira em 60s</p>
            <DashButton variant="ghost" onClick={onRefresh}><RefreshCw className="size-4" /> Atualizar QR</DashButton>
          </>
        ) : isConnecting ? (
          <>
            <Hourglass className="size-10 mb-3 animate-pulse" style={{ color: DASH_ACCENT.amber }} />
            <p className="text-sm text-dash-muted">Gerando QR Code...</p>
          </>
        ) : isReconnecting ? (
          <>
            <RefreshCw className="size-10 mb-3 animate-spin" style={{ color: DASH_ACCENT.amber }} />
            <p className="text-sm text-dash-muted mt-2">Reconectando automaticamente...</p>
            <p className="text-xs text-dash-faint mt-1">Aguarde — sem ação necessária</p>
          </>
        ) : (
          <>
            <MessageCircle className="size-10 mb-3 text-dash-faint" />
            <p className="text-sm text-dash-muted mb-5">Número desconectado</p>
            <DashButton onClick={onConnect}>Conectar Número {slot}</DashButton>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, loading }) {
  if (loading) return <DashBadge color={DASH_ACCENT.slate} dot={false}>Verificando...</DashBadge>;
  const map = {
    connected:    { label: "Conectado",         color: EMERALD,          pulse: true },
    qr_ready:     { label: "Aguardando QR",     color: DASH_ACCENT.amber, pulse: false },
    connecting:   { label: "Conectando...",     color: DASH_ACCENT.amber, pulse: true },
    reconnecting: { label: "Reconectando...",   color: DASH_ACCENT.amber, pulse: true },
    disconnected: { label: "Desconectado",      color: DASH_ACCENT.red,   pulse: false },
  };
  const s = map[status] || map.disconnected;
  return (
    <DashBadge color={s.color} dot={false}>
      <PulseDot color={s.color} pulse={s.pulse} />
      {s.label}
    </DashBadge>
  );
}

function TestSendCard({ sessions }) {
  const connected = sessions.filter(s => s.status === "connected");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Olá! Teste do Wayvo 🚀");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setErr(""); setOk("");
    if (!phone || !message) { setErr("Preencha número e mensagem"); return; }
    setLoading(true);
    try {
      await api("/api/whatsapp/send", { method: "POST", body: { phone, message } });
      setOk(`✅ Mensagem enviada com sucesso!`);
    } catch (e) {
      setErr(e.message || "Falha ao enviar");
    } finally { setLoading(false); }
  }

  return (
    <div className="dash-card">
      <h3 className="font-semibold mb-1 text-dash-ink flex items-center gap-2"><Send className="size-4" style={{ color: EMERALD }} /> Testar Envio</h3>
      <p className="text-xs text-dash-faint mb-5">
        {connected.length > 0
          ? `Usando número ${connected[0].slot} (slot ${connected[0].slot})`
          : "Nenhum número conectado"}
      </p>
      {!connected.length ? (
        <p className="text-sm text-dash-faint text-center py-6">🔒 Conecte pelo menos 1 número para testar</p>
      ) : (
        <div className="space-y-4 max-w-lg">
          <Field label="Número destino (com DDD)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11999999999" className="dash-input" />
          </Field>
          <Field label="Mensagem">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="dash-input min-h-[100px] resize-y" />
          </Field>
          {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/20 rounded-xl px-4 py-3">{err}</div>}
          {ok && <div className="text-sm text-dash-green bg-dash-green/10 border border-dash-green/20 rounded-xl px-4 py-3">{ok}</div>}
          <DashButton onClick={send} loading={loading}>Enviar Teste</DashButton>
        </div>
      )}
    </div>
  );
}
