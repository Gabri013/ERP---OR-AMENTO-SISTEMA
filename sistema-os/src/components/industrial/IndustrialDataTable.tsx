import { Download, FileDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/industrial/StatusPill";
import { cn } from "@/lib/utils";

export type IndustrialTableRow = Record<string, string | number>;

export function IndustrialDataTable({
  title,
  rows,
  dense = true,
}: {
  title: string;
  rows: IndustrialTableRow[];
  dense?: boolean;
}) {
  const columns = Object.keys(rows[0] ?? {});

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/5 shadow-[0_1px_2px_rgba(255,255,255,0.05)]">
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs text-white/70">
            Busca, filtros avancados, ordenacao, selecao multipla e exportacao.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input className="h-9 w-56 rounded-[6px] pl-8 text-xs" placeholder="Buscar registro..." />
          </div>
        </div>
      </div>

      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:min-w-[860px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#003D7A] text-white relative before:absolute before:inset-0 before:bg-[#003D7A]/90 before:content-['']">
            <tr>
              <th className="w-10 px-3 py-2">
                <input aria-label="Selecionar todos" type="checkbox" className="h-4 w-4 rounded border-white/40" />
              </th>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 text-[11px] font-bold uppercase tracking-normal">
                  {column.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-[11px] font-bold uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="border-b border-white/10 hover:bg-white/10">
                <td className="px-3 py-2">
                  <input aria-label="Selecionar linha" type="checkbox" className="h-4 w-4 rounded border-white/20" />
                </td>
                {columns.map((column) => {
                  const value = row[column];
                  const isStatus = column.toLowerCase().includes("status");
                  return (
                    <td
                      key={column}
                      className={cn(
                        "px-3 text-xs text-white/70",
                        dense ? "py-2" : "py-3",
                        column === "id" && "font-semibold text-white",
                      )}
                    >
                      {isStatus ? <StatusPill>{value}</StatusPill> : value}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <span className="text-xs text-white/50">—</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/60">
        <span>{rows.length} registros visiveis</span>
      </div>
    </div>
  );
}
