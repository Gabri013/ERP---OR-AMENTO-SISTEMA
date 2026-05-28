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
      className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[6px] border"
          style={{
            backgroundColor: `${accent}12`,
            borderColor: `${accent}24`,
            color: accent,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="truncate text-xs text-slate-500">{detail}</span>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold",
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
