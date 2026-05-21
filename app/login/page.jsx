"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { Field, Input, Button } from "../../components/ui/Field";
import { api, setAuth } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
      setAuth(r.token, r.user);
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
            Criar conta grátis
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
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <Button type="submit" loading={loading} className="w-full">Entrar →</Button>
      </form>
    </AuthShell>
  );
}
