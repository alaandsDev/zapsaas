"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, Bot, LayoutDashboard } from "lucide-react";
import Image from "next/image";

const HIGHLIGHTS = [
  {
    icon: Send,
    title: "Disparos em massa no WhatsApp",
    desc: "Envie campanhas para milhares de contatos com round-robin de mensagens e variáveis personalizadas.",
  },
  {
    icon: Bot,
    title: "Chatbot e automações 24/7",
    desc: "Atenda leads automaticamente, qualifique e converta enquanto você dorme.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel completo de vendas",
    desc: "Acompanhe leads, contatos, histórico de disparos e estatísticas em tempo real.",
  },
];

const TABS = [
  { mode: "login", label: "Entrar", href: "/login" },
  { mode: "register", label: "Criar conta", href: "/register" },
];

export default function AuthShell({ mode = "login", title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F5F6F8] text-[#0A1020]">
      {/* LADO ESQUERDO — destaque do sistema (só em telas largas) */}
      <div className="relative hidden lg:flex flex-col justify-between gap-12 p-12 overflow-hidden border-r border-[#E4E7EC] bg-[linear-gradient(160deg,#F4FBF7_0%,#FFFFFF_45%,#F1F5FD_100%)]">
        {/* grid pattern de fundo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10,16,32,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,16,32,0.04) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse 60% 55% at 30% 40%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 30% 40%, black, transparent)",
          }}
        />

        {/* blobs decorativos animados */}
        <motion.div
          className="absolute -top-32 -left-32 size-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,138,71,0.18), transparent 70%)" }}
          animate={{ x: [0, 24, 0], y: [0, 16, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 size-[420px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)" }}
          animate={{ x: [0, -20, 0], y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-2.5 text-[#0A1020]" aria-label="Wayvo">
          <Image src="/wayvo-icon.png" alt="Wayvo" width={30} height={30} priority style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span className="font-bold text-xl tracking-[-0.02em]">Wayvo</span>
        </Link>

        <motion.div
          className="relative z-10 max-w-[520px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-[clamp(30px,3.4vw,42px)] leading-[1.08] tracking-[-0.035em] font-bold">
            Venda mais no WhatsApp.<br />
            <span className="text-[#0E8A47]">No automático.</span>
          </h2>
          <p className="mt-[18px] text-[17.5px] leading-[1.6] text-[#4B5565]">
            A plataforma completa para escalar suas vendas com disparos, chatbot e automações.
          </p>

          <ul className="mt-9 space-y-5">
            {HIGHLIGHTS.map((h, i) => (
              <motion.li
                key={h.title}
                className="flex gap-3.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.08, ease: "easeOut" }}
              >
                <div className="shrink-0 size-[42px] rounded-[13px] bg-white border border-[#D2F0E0] text-[#0E8A47] flex items-center justify-center">
                  <h.icon className="size-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] text-[#0A1020]">{h.title}</h3>
                  <p className="text-[14.5px] text-[#5A6474] mt-0.5">{h.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <motion.div
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-white border border-[#D2F0E0] px-4 py-2 text-[13px] font-medium text-[#0A1020] shadow-[0_10px_24px_-16px_rgba(10,16,32,0.3)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0E8A47] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#0E8A47]" />
            </span>
            200+ negócios operando agora
          </motion.div>
        </motion.div>

        <div className="relative z-10 text-[13px] text-[#8A94A6]">
          © {new Date().getFullYear()} Wayvo · Todos os direitos reservados
        </div>
      </div>

      {/* LADO DIREITO — formulário */}
      <div className="flex items-center justify-center px-6 py-14 bg-[#F5F6F8]">
        <motion.div
          className="w-full max-w-[440px]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Link
            href="/"
            className="lg:hidden mb-6 flex items-center justify-center gap-2 text-[#0A1020]"
            aria-label="Wayvo"
          >
            <Image src="/wayvo-icon.png" alt="Wayvo" width={26} height={26} style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span className="font-bold text-lg tracking-[-0.02em]">Wayvo</span>
          </Link>

          {/* tab switcher */}
          <div className="mb-5 inline-flex w-full rounded-full bg-[#F4F6F8] border border-[#EDEFF3] p-[5px]">
            {TABS.map((t) => {
              const active = t.mode === mode;
              return (
                <Link
                  key={t.mode}
                  href={t.href}
                  className={
                    "flex-1 text-center rounded-full py-2 text-sm font-semibold transition-all " +
                    (active
                      ? "bg-white text-[#0A1020] shadow-[0_4px_12px_-4px_rgba(10,16,32,0.18)]"
                      : "text-[#6B7585] hover:text-[#0A1020]")
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          <div className="bg-white border border-[#E9ECF1] rounded-[22px] p-8 shadow-[0_24px_50px_-34px_rgba(10,16,32,0.4)]">
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-[#0A1020]">{title}</h1>
            {subtitle && <p className="mt-2 text-[14.5px] leading-[1.6] text-[#5A6474]">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="text-center text-sm text-[#5A6474] mt-6">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
