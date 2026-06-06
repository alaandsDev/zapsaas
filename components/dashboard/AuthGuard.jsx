"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getRole } from "../../lib/api";

// Páginas que o Agent pode acessar (mesma lista do Sidebar)
const AGENT_ALLOWED = ["/dashboard/conversas", "/dashboard/crm"];

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

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
    setOk(true);
  }, [router, pathname]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
