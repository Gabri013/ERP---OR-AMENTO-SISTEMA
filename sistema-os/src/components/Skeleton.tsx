import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-8 w-3/5" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex gap-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={`cell-${i}-${j}`} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="flex items-center justify-between gap-2 pt-3 border-t">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function SkeletonButton() {
  return <Skeleton className="h-9 w-24 rounded-md" />;
}

export function SkeletonInput() {
  return <Skeleton className="h-9 w-full rounded-md" />;
}
