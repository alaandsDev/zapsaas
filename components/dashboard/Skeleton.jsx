// Skeletons reutilizáveis — sensação de produto rápido em vez de spinner.

export function Skeleton({ className = "", style }) {
  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] rounded-lg ${className}`}
    />
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04]">
      <Skeleton className="size-10 !rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
      {Array.from({ length: Math.max(0, cols - 2) }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-16" />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5, cols = 4 }) {
  return (
    <div className="card p-4">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Skeleton className="size-8 !rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-16 !rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  );
}
