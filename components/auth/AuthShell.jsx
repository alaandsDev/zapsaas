import Link from "next/link";
import Logo from "../Logo";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="flex justify-center mb-8" aria-label="ZapFlow">
          <Logo size={36} />
        </Link>
        <div className="card p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-ink-300 mt-2 text-sm">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="text-center text-sm text-ink-300 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
