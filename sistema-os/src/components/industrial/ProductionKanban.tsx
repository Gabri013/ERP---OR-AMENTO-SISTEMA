import { Clock, GripVertical, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { StatusPill } from "@/components/industrial/StatusPill";
import { cn } from "@/lib/utils";

const columns = [
  { key: "corte", title: "Corte" },
  { key: "dobra", title: "Dobra" },
  { key: "solda", title: "Solda" },
  { key: "montagem", title: "Montagem" },
  { key: "acabamento", title: "Acabamento" },
  { key: "polimento", title: "Polimento" },
  { key: "expedicao", title: "Expedicao" },
];

type ProductionOrder = {
  id: number;
  number: string;
  client: string;
  product?: string;
  currentSector: string;
  status: string;
  priority: string;
  progress?: number;
  elapsedHours?: number;
  slaHours?: number;
};

export function ProductionKanban({ orders }: { orders: ProductionOrder[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1180px] grid-cols-7 gap-3">
        {columns.map((column) => {
          const items = orders.filter((item) => item.currentSector === column.key || item.status === column.key);
          return (
            <div key={column.key} className="rounded-[8px] border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-900">{column.title}</h3>
                  <p className="text-[11px] text-slate-500">{items.length} O.S.</p>
                </div>
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    column.key === "solda" ? "bg-orange-500" : "bg-emerald-500",
                  )}
                />
              </div>
              <div className="space-y-3 p-3">
                {items.length === 0 && (
                  <div className="rounded-[8px] border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-400">
                    Sem O.S. neste setor
                  </div>
                )}
                {items.map((item) => (
                  <motion.div
                    key={`${column.key}-${item.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[8px] border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#003D7A]">{item.number}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-900">{item.product ?? "Produto sob encomenda"}</p>
                      </div>
                      <GripVertical className="h-4 w-4 text-slate-300" />
                    </div>
                    <p className="mt-2 truncate text-[11px] text-slate-500">{item.client}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-[#003D7A]" style={{ width: `${item.progress ?? 0}%` }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusPill tone={item.priority}>{item.priority}</StatusPill>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        {Math.round(item.elapsedHours ?? 0)}/{Math.round(item.slaHours ?? 0)}h
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-[11px] font-medium text-slate-500">{item.currentSector}</span>
                      <QrCode className="h-4 w-4 text-slate-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
