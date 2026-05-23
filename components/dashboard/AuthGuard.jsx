"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getUser } from "../../lib/api";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = getUser();
  const isAgent = !!user?.workspace_owner_id;

  return (
    <>
      {isAgent && (
        <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium bg-blue-600/90 backdrop-blur-sm text-white">
          <span className="size-1.5 rounded-full bg-blue-300 animate-pulse" />
          Modo Agente — operando no workspace de outro usuário
          <Link href="/dashboard/configuracoes" className="underline underline-offset-2 opacity-80 hover:opacity-100 ml-2">
            Ver equipe
          </Link>
        </div>
      )}
      <div className={isAgent ? "pt-7" : ""}>{children}</div>
    </>
  );
}
