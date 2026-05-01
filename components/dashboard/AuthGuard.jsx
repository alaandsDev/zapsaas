"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";

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
  return children;
}
