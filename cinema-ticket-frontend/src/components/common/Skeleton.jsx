export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800 ${className}`} />;
}

export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <Skeleton className="h-40 w-full" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
