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
    <div className="rounded-[8px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Busca, filtros avancados, ordenacao, selecao multipla e exportacao.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-9 w-56 rounded-[6px] pl-8 text-xs" placeholder="Buscar registro..." />
          </div>
          <Button variant="outline" size="sm" className="rounded-[6px]">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="rounded-[6px]">
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="rounded-[6px]">
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:min-w-[860px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#003D7A] text-white">
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
              <tr key={String(row.id ?? index)} className="border-b border-slate-100 hover:bg-[#E0E9FF]/35">
                <td className="px-3 py-2">
                  <input aria-label="Selecionar linha" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                </td>
                {columns.map((column) => {
                  const value = row[column];
                  const isStatus = column.toLowerCase().includes("status");
                  return (
                    <td
                      key={column}
                      className={cn(
                        "px-3 text-xs text-slate-700",
                        dense ? "py-2" : "py-3",
                        column === "id" && "font-semibold text-slate-950",
                      )}
                    >
                      {isStatus ? <StatusPill>{value}</StatusPill> : value}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="sm" className="h-7 rounded-[6px] text-xs text-[#003D7A]">
                    Abrir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>Pagina 1 de 12 - {rows.length} registros visiveis</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs">
            Anterior
          </Button>
          <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs">
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}
