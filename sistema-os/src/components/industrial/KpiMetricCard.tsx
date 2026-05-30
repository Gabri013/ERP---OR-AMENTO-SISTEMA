import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiMetricCard({
  title,
  value,
  detail,
  trend,
  icon: Icon,
  accent = "#003D7A",
}: {
  title: string;
  value: string;
  detail: string;
  trend?: number;
  icon: LucideIcon;
  accent?: string;
}) {
  const positive = (trend ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[8px] border border-white/10 bg-white/5 p-4 shadow-[0_1px_2px_rgba(255,255,255,0.04)]"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-white/60">{title}</p>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-white">{value}</p>
        </div>
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-[6px] border"
          style={{
            backgroundColor: `${accent}12`,
            borderColor: `${accent}24`,
            color: accent,
          }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="truncate text-[11px] sm:text-xs text-white/70">{detail}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold shrink-0",
              positive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
