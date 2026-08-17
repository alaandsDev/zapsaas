"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearAuth } from "../../lib/api";
import Logo from "../Logo";

export default function SubscribeGate() {
  const router = useRouter();
  const [loading, setLoading] = useState(null); // 'starter' | 'pro' | null
  const [err, setErr] = useState("");

  async function subscribe(planId) {
    setLoading(planId);
    setErr("");
    try {
      const r = await api("/api/stripe/checkout", { method: "POST", body: { planId } });
      if (!r?.url) throw new Error("Não foi possível abrir o pagamento");
      window.location.href = r.url;
    } catch (e) {
      setErr(e.message || "Não conseguimos abrir o pagamento agora. Tente de novo.");
      setLoading(null);
    }
  }

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="card p-7 text-center">
          <h1 className="text-xl font-bold text-ink-100">Sua assinatura não está ativa</h1>
          <p className="mt-2 text-sm text-ink-300 leading-relaxed">
            Seu período de teste terminou ou nenhuma assinatura foi concluída ainda.
            Escolha um plano pra continuar operando no Wayvo.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => subscribe("starter")}
              disabled={!!loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading === "starter" ? "Abrindo pagamento..." : "Assinar Starter — R$ 97,90/mês →"}
            </button>
            <button
              onClick={() => subscribe("pro")}
              disabled={!!loading}
              className="btn-secondary w-full disabled:opacity-60"
            >
              {loading === "pro" ? "Abrindo pagamento..." : "Assinar Pro — R$ 197,90/mês →"}
            </button>
          </div>

          {err && <p className="mt-3 text-xs text-red-400 font-medium">{err}</p>}

          <button onClick={logout} className="mt-5 text-xs text-ink-500 hover:text-ink-300 transition-colors">
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
