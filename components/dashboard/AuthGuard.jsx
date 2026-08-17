"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getRole, api } from "../../lib/api";
import SubscribeGate from "./SubscribeGate";

// Páginas que o Agent pode acessar (mesma lista do Sidebar)
const AGENT_ALLOWED = ["/dashboard/conversas", "/dashboard/crm"];

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    // Agent tentando acessar página bloqueada → manda pra Conversas
    if (getRole() === "agent" && !AGENT_ALLOWED.some((p) => pathname.startsWith(p))) {
      router.replace("/dashboard/conversas");
      return;
    }

    // Agentes (membros de equipe) não são donos da assinatura — quem
    // resolve isso é o owner do workspace, não trava o acesso do agente.
    if (getRole() === "agent") {
      setOk(true);
      return;
    }

    let cancelled = false;
    api("/api/subscription")
      .then((sub) => {
        if (cancelled) return;
        setBlocked(!sub?.plan || sub.plan === "free");
        setOk(true);
      })
      .catch(() => {
        // Se a checagem falhar (erro de rede etc), não trava quem já tem
        // token válido — melhor deixar entrar do que derrubar todo mundo.
        if (!cancelled) { setOk(true); }
      });
    return () => { cancelled = true; };
  }, [router, pathname]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (blocked) {
    return <SubscribeGate />;
  }

  const isAgent = getRole() === "agent";

  return (
    <>
      {isAgent && (
        <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium bg-blue-600/90 backdrop-blur-sm text-white">
          <span className="size-1.5 rounded-full bg-blue-300 animate-pulse" />
          Modo Agente
        </div>
      )}
      <div className={isAgent ? "pt-7" : ""}>{children}</div>
    </>
  );
}
