"use client";
import { useEffect, useRef, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Textarea, Button } from "../../../components/ui/Field";
import { api } from "../../../lib/api";

export default function Conexoes() {
  const [status, setStatus] = useState({ status: "disconnected" });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const pollRef = useRef(null);

  async function refresh() {
    try {
      const data = await api("/api/whatsapp/status");
      setStatus(data || { status: "disconnected" });
      if (data?.status === "connected") stopPoll();
    } catch {}
    finally { setLoading(false); }
  }

  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(refresh, 2500);
  }
  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => {
    refresh();
    return () => stopPoll();
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      await api("/api/whatsapp/connect", { method: "POST" });
      await refresh();
      startPoll();
    } catch (e) {
      alert(e.message || "Erro ao conectar");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!confirm("Desconectar o WhatsApp? Você precisará escanear o QR novamente.")) return;
    try {
      await api("/api/whatsapp/disconnect", { method: "POST" });
      setStatus({ status: "disconnected" });
    } catch (e) {
      alert(e.message || "Erro ao desconectar");
    }
  }

  const isConnected = status.status === "connected";
  const hasQR = status.status === "qr_ready" && status.qr;

  return (
    <>
      <Topbar title="Conexões" subtitle="Conecte e gerencie seus números WhatsApp" />
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
        <div className="card p-6 lg:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold">WhatsApp Business</h3>
              <p className="text-sm text-ink-300 mt-1">Conexão principal</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isConnected
                  ? "bg-primary/15 text-primary border-primary/30"
                  : hasQR
                  ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                  : "bg-white/5 text-ink-300 border-white/10"
              }`}
            >
              <span className={`size-1.5 rounded-full ${isConnected ? "bg-primary" : hasQR ? "bg-yellow-300" : "bg-ink-500"}`} />
              {loading ? "Verificando..." : isConnected ? "Conectado" : hasQR ? "Aguardando QR" : "Desconectado"}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="text-center">
              {isConnected ? (
                <div>
                  <div className="text-6xl mb-4">✅</div>
                  <h4 className="font-semibold text-lg">WhatsApp Conectado!</h4>
                  <p className="text-sm text-ink-300 mt-1">Pronto para enviar mensagens reais</p>
                  {status.phone && (
                    <div className="mt-5 inline-block px-5 py-3 rounded-xl bg-primary/10 border border-primary/30">
                      <div className="text-xs text-ink-300">NÚMERO CONECTADO</div>
                      <div className="text-xl font-bold text-primary mt-1">+{status.phone}</div>
                    </div>
                  )}
                  <div className="mt-6">
                    <Button variant="danger" onClick={disconnect}>Desconectar</Button>
                  </div>
                </div>
              ) : hasQR ? (
                <div>
                  <div className="inline-block bg-white p-3 rounded-2xl border-4 border-primary/30">
                    <img
                      src={status.qr.startsWith("data:") ? status.qr : `data:image/png;base64,${status.qr}`}
                      alt="QR Code"
                      className="size-56 block"
                    />
                  </div>
                  <p className="text-xs text-ink-500 mt-3">QR expira em 60s — clique em Atualizar se necessário</p>
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button variant="ghost" onClick={refresh}>🔄 Atualizar QR</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">💬</div>
                  <h4 className="font-semibold text-lg">WhatsApp Desconectado</h4>
                  <p className="text-sm text-ink-300 mt-1">Conecte para começar a enviar mensagens</p>
                  <div className="mt-6">
                    <Button onClick={connect} loading={connecting}>Conectar WhatsApp</Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Como conectar</h4>
              <ol className="space-y-3 text-sm text-ink-300">
                <Step n={1}>Clique em <strong className="text-ink-100">Conectar WhatsApp</strong> e aguarde o QR Code</Step>
                <Step n={2}>Abra o <strong className="text-ink-100">WhatsApp</strong> no celular</Step>
                <Step n={3}>Vá em <strong className="text-ink-100">Aparelhos conectados → Conectar um aparelho</strong></Step>
                <Step n={4}>Aponte a câmera para o QR Code ao lado</Step>
              </ol>
            </div>
          </div>
        </div>

        <TestSendCard enabled={isConnected} />
      </div>
    </>
  );
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="size-6 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function TestSendCard({ enabled }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Olá! Teste do ZapFlow 🚀");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setErr(""); setOk("");
    if (!phone || !message) { setErr("Preencha número e mensagem"); return; }
    setLoading(true);
    try {
      await api("/api/whatsapp/send", { method: "POST", body: { phone, message } });
      setOk("Mensagem enviada com sucesso!");
    } catch (e) {
      setErr(e.message || "Falha ao enviar");
    } finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">🧪 Testar Envio</h3>
      {!enabled ? (
        <p className="text-sm text-ink-500 text-center py-6">🔒 Conecte o WhatsApp para testar</p>
      ) : (
        <div className="space-y-4 max-w-lg">
          <Field label="Número (com DDD)">
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
