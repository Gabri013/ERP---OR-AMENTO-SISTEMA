import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  critica: "border-red-200 bg-red-50 text-red-700",
  critico: "border-red-200 bg-red-50 text-red-700",
  gargalo: "border-orange-200 bg-orange-50 text-orange-700",
  alta: "border-orange-200 bg-orange-50 text-orange-700",
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  baixo: "border-amber-200 bg-amber-50 text-amber-700",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  operando: "border-emerald-200 bg-emerald-50 text-emerald-700",
  concluido: "border-emerald-200 bg-emerald-50 text-emerald-700",
  parado: "border-slate-300 bg-slate-100 text-slate-700",
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
        toneMap[key] ?? "border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
