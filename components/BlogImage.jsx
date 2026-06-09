"use client";
import { useState } from "react";

// Imagem de capa do blog com fallback para gradiente + ícone se a imagem falhar.
export default function BlogImage({ cover, className = "", height = "h-44" }) {
  const [failed, setFailed] = useState(false);
  const gradient = `linear-gradient(135deg, ${cover.from}33, ${cover.to}33)`;

  if (failed || !cover.img) {
    return (
      <div className={`${height} relative flex items-center justify-center text-5xl ${className}`} style={{ background: gradient }}>
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 30% 30%, ${cover.from}55, transparent 60%)` }} />
        <span className="relative">{cover.icon}</span>
      </div>
    );
  }

  return (
    <div className={`${height} relative overflow-hidden ${className}`} style={{ background: gradient }}>
      <img
        src={cover.img}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
      {/* leve overlay pra integrar com o tema escuro */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,17,32,0.55), transparent 55%)" }} />
    </div>
  );
}
