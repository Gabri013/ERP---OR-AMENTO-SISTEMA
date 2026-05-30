import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  critica: "border-red-500/20 bg-red-500/10 text-red-200",
  critico: "border-red-500/20 bg-red-500/10 text-red-200",
  gargalo: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  alta: "border-orange-500/20 bg-orange-500/10 text-orange-200",
  pendente: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  baixo: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  normal: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  ok: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  operando: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  concluido: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  parado: "border-white/10 bg-white/5 text-white/70",
};

export function StatusPill({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  const key = String(tone ?? children).toLowerCase();

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-[4px] border px-2 text-[11px] font-semibold uppercase tracking-normal",
        toneMap[key] ?? "border-white/10 bg-white/5 text-white/70",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
