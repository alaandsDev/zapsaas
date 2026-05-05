"use client";

export default function ComingSoonOverlay({ title = "Em breve", children }) {
  return (
    <div className="relative min-h-[calc(100vh-6rem)]">
      <div className="pointer-events-none select-none blur-sm opacity-45">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <div className="card w-full max-w-sm p-8 text-center bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
            <svg className="size-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v5" />
              <path d="M12 17v5" />
              <path d="M4.22 4.22l3.54 3.54" />
              <path d="M16.24 16.24l3.54 3.54" />
              <path d="M2 12h5" />
              <path d="M17 12h5" />
              <path d="M4.22 19.78l3.54-3.54" />
              <path d="M16.24 7.76l3.54-3.54" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-ink-300">
            Essa área está sendo otimizada e volta em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
