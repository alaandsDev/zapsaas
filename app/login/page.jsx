"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { Field, Input, Button } from "../../components/ui/Field";
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
      title="Entrar no Wayvo"
      subtitle="Acesse seu painel e veja suas vendas chegando"
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Testar grátis
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-mail">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Field>
        <Field label="Senha">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setRemember(v => !v)}
            className={`size-4 rounded flex items-center justify-center border transition-all ${remember ? "bg-primary border-primary" : "border-white/20 bg-white/[0.04]"}`}
          >
            {remember && <svg className="size-2.5 text-bg" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className="text-sm text-ink-300">Lembrar de mim</span>
        </label>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <Button type="submit" loading={loading} className="w-full">Entrar →</Button>
      </form>
      <div className="mt-4"><GoogleButton /></div>
    </AuthShell>
  );
}
