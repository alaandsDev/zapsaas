"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { Field, Input, Button } from "../../components/ui/Field";
import { api, setAuth } from "../../lib/api";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password.length < 6) return setErr("Senha precisa ter no mínimo 6 caracteres");
    setLoading(true);
    try {
      const r = await api("/api/auth/register", {
        method: "POST",
        auth: false,
        body: { name, email, phone, password },
      });
      setAuth(r.token, r.user);
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta grátis"
      subtitle="Plano Starter grátis para sempre. Sem cartão de crédito."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nome">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </Field>
        <Field label="E-mail">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Field>
        <Field label="WhatsApp" hint="Com DDD — ex: 11987654321">
          <Input type="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11987654321" />
        </Field>
        <Field label="Senha" hint="Mínimo 6 caracteres">
          <Input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
        <Button type="submit" loading={loading} className="w-full">Criar conta grátis →</Button>
        <p className="text-xs text-ink-500 text-center">
          Ao criar sua conta você concorda com nossos{" "}
          <Link href="/termos" target="_blank" className="text-primary hover:underline">Termos de Uso</Link>
          {" "}e{" "}
          <Link href="/privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
