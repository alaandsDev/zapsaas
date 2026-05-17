"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Textarea, Button } from "../../../components/ui/Field";
import { api, API_URL, getToken } from "../../../lib/api";

const MAX_SLOTS = 2;

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

  // SSE — atualização instantânea do status da conexão
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let es;
    try { es = new EventSource(`${API_URL}/api/chats/stream?token=${encodeURIComponent(token)}`); } catch { return; }

    es.addEventListener("connection", (e) => {
      try {
        const d = JSON.parse(e.data);
        setSessions((prev) => prev.map((s) =>
          s.slot === d.slot
            ? { ...s, status: d.status, qr: d.qr ?? (d.status === "connected" ? null : s.qr), phone: d.phone ?? s.phone }
            : s
        ));
        // Garantia: re-busca completa após poucos ms (caso o evento chegue antes da persistência)
        setTimeout(refresh, 300);
      } catch {}
    });

    es.onerror = () => { /* navegador reconecta sozinho */ };
    return () => { try { es.close(); } catch {} };
  }, [refresh]);

  // Para polling quando todas as sessões estão conectadas ou desconectadas (sem QR pendente)
  useEffect(() => {
    const hasPending = sessions.some(s => s.status === "connecting" || s.status === "qr_ready");
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
          <div className="rounded-xl bg-primary/10 border border-primary/25 px-5 py-4 flex items-center gap-3 text-sm">
            <span className="text-xl">🔄</span>
            <div>
              <span className="font-semibold text-primary">Round-robin ativo!</span>
              <span className="text-ink-300 ml-2">Os disparos vão alternar entre {connectedCount} números — 1 mensagem por número por vez, reduzindo risco de ban.</span>
            </div>
          </div>
        )}
        {connectedCount === 1 && (
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-5 py-4 flex items-center gap-3 text-sm">
            <span className="text-xl">💡</span>
            <div>
              <span className="font-semibold text-blue-300">Dica:</span>
              <span className="text-ink-300 ml-2">Conecte um segundo número para ativar o round-robin e enviar com mais segurança.</span>
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

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`size-8 rounded-lg flex items-center justify-center text-sm font-bold
            ${isConnected ? "bg-primary/20 text-primary" : "bg-white/5 text-ink-400"}`}>
            {slot}
          </div>
          <div>
            <h3 className="font-semibold text-sm">Número {slot}</h3>
            <p className="text-xs text-ink-500">{isConnected ? `+${phone}` : "Não conectado"}</p>
          </div>
        </div>
        <StatusBadge status={status} loading={loading} />
      </div>

      <div className="flex flex-col items-center py-4">
        {isConnected ? (
          <>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm text-ink-300 mb-1">WhatsApp conectado</p>
            <div className="mt-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/25 text-primary font-bold text-lg">
              +{phone}
            </div>
            <div className="mt-5">
              <Button variant="danger" onClick={onDisconnect}>Desconectar</Button>
            </div>
          </>
        ) : hasQR ? (
          <>
            <div className="bg-white p-2.5 rounded-xl border-2 border-primary/30 mb-3">
              <img
                src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`}
                alt="QR Code"
                className="size-52 block"
              />
            </div>
            <p className="text-xs text-ink-500 mb-3">QR expira em 60s</p>
            <Button variant="ghost" onClick={onRefresh}>🔄 Atualizar QR</Button>
          </>
        ) : isConnecting ? (
          <>
            <div className="text-5xl mb-3 animate-pulse">⏳</div>
            <p className="text-sm text-ink-300">Gerando QR Code...</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-3">💬</div>
            <p className="text-sm text-ink-300 mb-5">Número desconectado</p>
            <Button onClick={onConnect}>Conectar Número {slot}</Button>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, loading }) {
  if (loading) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-ink-300">
      Verificando...
    </span>
  );
  const map = {
    connected:    { label: "Conectado",     cls: "bg-primary/15 text-primary border-primary/30",       dot: "bg-primary" },
    qr_ready:     { label: "Aguardando QR", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30", dot: "bg-yellow-300" },
    connecting:   { label: "Conectando...", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30",    dot: "bg-blue-300 animate-pulse" },
    disconnected: { label: "Desconectado",  cls: "bg-white/5 text-ink-400 border-white/10",            dot: "bg-ink-500" },
  };
  const s = map[status] || map.disconnected;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
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
    <div className="card p-6">
      <h3 className="font-semibold mb-1">🧪 Testar Envio</h3>
      <p className="text-xs text-ink-500 mb-5">
        {connected.length > 0
          ? `Usando número ${connected[0].slot} (slot ${connected[0].slot})`
          : "Nenhum número conectado"}
      </p>
      {!connected.length ? (
        <p className="text-sm text-ink-500 text-center py-6">🔒 Conecte pelo menos 1 número para testar</p>
      ) : (
        <div className="space-y-4 max-w-lg">
          <Field label="Número destino (com DDD)">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11999999999" />
          </Field>
          <Field label="Mensagem">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
          {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
          {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
          <Button onClick={send} loading={loading}>📤 Enviar Teste</Button>
        </div>
      )}
    </div>
  );
}
