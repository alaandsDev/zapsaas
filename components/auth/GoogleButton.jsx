"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuth } from "../../lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Botão "Entrar com Google" via Google Identity Services.
 * Gated por NEXT_PUBLIC_GOOGLE_CLIENT_ID — não renderiza nada se não configurado.
 */
export default function GoogleButton() {
  const ref = useRef(null);
  const router = useRouter();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!CLIENT_ID || typeof window === "undefined") return;

    const handle = async (response) => {
      setErr("");
      try {
        const r = await api("/api/auth/google", {
          method: "POST",
          auth: false,
          body: { credential: response.credential },
        });
        setAuth(r.token, r.user, true);
        router.push("/dashboard");
      } catch (e) {
        setErr(e.message || "Falha ao entrar com Google");
      }
    };

    const init = () => {
      if (!window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handle });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline", size: "large", width: 320, text: "continue_with", shape: "pill",
      });
    };

    if (window.google?.accounts?.id) { init(); return; }
    const existing = document.getElementById("gsi-script");
    if (existing) { existing.addEventListener("load", init); return; }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [router]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px bg-white/10 flex-1" />
        <span className="text-xs text-ink-500">ou</span>
        <div className="h-px bg-white/10 flex-1" />
      </div>
      <div className="flex justify-center" ref={ref} />
      {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
    </div>
  );
}
