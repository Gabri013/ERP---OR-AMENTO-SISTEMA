import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, ChevronRight, Clock } from "lucide-react";
import { Link } from "wouter";

export interface KanbanCardData {
  id: number;
  numero: string;
  clienteNome: string;
  etapaAtual?: string;
  prioridade?: string;
  status: string;
  dataTermino?: string | null;
  atrasada?: boolean;
  meta?: Record<string, any>;
}

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  items: KanbanCardData[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onMove?: (itemId: number, fromStatus: string, toStatus: string) => void;
  isLoading?: boolean;
  detailPath?: (id: number) => string;
  cardExtra?: (item: KanbanCardData) => React.ReactNode;
}

const prioridadeDot: Record<string, string> = {
  vermelho: "bg-red-500",
  amarelo: "bg-yellow-500",
  verde: "bg-green-500",
};

function formatDate(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch { return null; }
}

function KanbanCard({
  item,
  columns,
  onMove,
  detailPath,
  cardExtra,
}: {
  item: KanbanCardData;
  columns: KanbanColumn[];
  onMove?: (id: number, from: string, to: string) => void;
  detailPath?: (id: number) => string;
  cardExtra?: (item: KanbanCardData) => React.ReactNode;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const dt = formatDate(item.dataTermino);

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-3 space-y-2 cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group",
        item.atrasada && "border-red-500/40 bg-red-500/5",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {item.prioridade && (
            <div className={cn("w-2 h-2 rounded-full shrink-0", prioridadeDot[item.prioridade] ?? "bg-gray-400")} />
          )}
          <span className="font-mono font-bold text-xs text-foreground">{item.numero}</span>
          {item.atrasada && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {detailPath && (
            <Link href={detailPath(item.id)}>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Eye className="h-3 w-3" />
              </Button>
            </Link>
          )}
          {onMove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Client */}
      <p className="text-xs text-muted-foreground truncate">{item.clienteNome}</p>

      {/* Etapa + date */}
      <div className="flex items-center justify-between gap-1">
        {item.etapaAtual && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.etapaAtual}
          </Badge>
        )}
        {dt && (
          <span className={cn("text-[10px] flex items-center gap-0.5", item.atrasada ? "text-red-500" : "text-muted-foreground")}>
            <Clock className="h-2.5 w-2.5" />
            {dt}
          </span>
        )}
      </div>

      {/* Extra content */}
      {cardExtra && cardExtra(item)}

      {/* Move menu */}
      {showMoveMenu && onMove && (
        <div className="border-t pt-2 mt-1 space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase">Mover para:</p>
          {columns
            .filter((c) => c.id !== item.status)
            .map((col) => (
              <button
                key={col.id}
                className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(item.id, item.status, col.id);
                  setShowMoveMenu(false);
                }}
              >
                → {col.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({ columns, onMove, isLoading, detailPath, cardExtra }: KanbanBoardProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-64 shrink-0 space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {columns.map((col) => (
        <div key={col.id} className="w-64 shrink-0 flex flex-col gap-2">
          {/* Column header */}
          <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg border", col.bgColor)}>
            <span className={cn("text-xs font-semibold uppercase tracking-wide", col.color)}>
              {col.label}
            </span>
            <span className={cn("text-xs font-bold tabular-nums", col.color)}>
              {col.items.length}
            </span>
          </div>
          {/* Cards */}
          <div className="flex flex-col gap-2 overflow-y-auto">
            {col.items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg">
                Vazio
              </div>
            ) : (
              col.items.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  columns={columns}
                  onMove={onMove}
                  detailPath={detailPath}
                  cardExtra={cardExtra}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
