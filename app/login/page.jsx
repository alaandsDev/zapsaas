"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { AuthField, AuthInput, AuthButton } from "../../components/auth/AuthField";
import { api, setAuth } from "../../lib/api";
import GoogleButton from "../../components/auth/GoogleButton";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      setAuth(r.token, r.user, remember);
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode="login"
      title="Entrar no Wayvo"
      subtitle="Acesse seu painel e veja suas vendas chegando"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-[#0E8A47] hover:text-[#0B7239] font-semibold">
            Testar 7 dias →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="E-mail">
          <AuthInput type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </AuthField>
        <AuthField label="Senha">
          <AuthInput type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </AuthField>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRemember(v => !v)}
              className={`size-[19px] rounded-[6px] flex items-center justify-center border transition-all ${remember ? "bg-[#0E8A47] border-[#0E8A47]" : "border-[#D5DAE1] bg-white"}`}
            >
              {remember && <svg className="size-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-sm text-[#4B5565]">Lembrar de mim</span>
          </label>
          <a
            href="mailto:suporte@wayvo.app.br?subject=Esqueci%20minha%20senha"
            className="text-sm font-medium text-[#0E8A47] hover:text-[#0B7239]"
          >
            Esqueci a senha
          </a>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{err}</div>}
        <AuthButton type="submit" loading={loading}>Entrar →</AuthButton>
      </form>
      <div className="mt-6"><GoogleButton /></div>
    </AuthShell>
  );
}
