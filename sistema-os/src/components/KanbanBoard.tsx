import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Clock, GripVertical } from "lucide-react";
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

function getSectorColor(item: KanbanCardData): string {
  const etapa = item.etapaAtual ?? "";
  if (etapa === "refrigeracao") return "bg-blue-500";
  if (etapa === "mobiliario") return "bg-green-500";
  if (etapa === "coccao") return "bg-yellow-500";
  if (etapa === "solda") return "bg-orange-500";
  if (etapa === "corte") return "bg-cyan-500";
  if (etapa === "dobra") return "bg-violet-500";
  if (etapa === "engenharia" || etapa === "programacao") return "bg-indigo-500";
  if (etapa === "concluida" || etapa === "entregue") return "bg-emerald-500";
  if (etapa === "embalagem" || etapa === "expedicao") return "bg-teal-500";
  return prioridadeDot[item.prioridade ?? ""] ?? "bg-slate-500";
}

const etapaLabels: Record<string, string> = {
  programacao: "Programação",
  engenharia: "Engenharia",
  corte: "Corte",
  dobra: "Dobra",
  tubo: "Tubo",
  solda: "Solda",
  coccao: "Cocção",
  refrigeracao: "Refrigeração",
  mobiliario: "Mobiliário",
  montagem: "Montagem",
  revisao: "Revisão",
  embalagem: "Embalagem",
  expedicao: "Expedição",
  autorizacao: "Autorização",
  concluida: "Concluída",
  entregue: "Entregue",
};

function formatDate(d?: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return null;
  }
}

function KanbanCard({
  item,
  index,
  detailPath,
  cardExtra,
}: {
  item: KanbanCardData;
  index: number;
  detailPath?: (id: number) => string;
  cardExtra?: (item: KanbanCardData) => React.ReactNode;
}) {
  const dt = formatDate(item.dataTermino);

  return (
    <Draggable draggableId={`os-${item.id}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "bg-card border rounded-lg p-3 space-y-2 transition-all select-none",
            snapshot.isDragging && "shadow-xl rotate-1 ring-2 ring-primary/50",
            item.atrasada && "border-red-500/40 bg-red-500/5",
          )}
        >
          <div className="flex items-start gap-1.5">
            <div
              {...provided.dragHandleProps}
              className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  {(item.prioridade || item.etapaAtual) && (
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        getSectorColor(item),
                      )}
                      title={`Etapa: ${item.etapaAtual ?? "—"} | Prioridade: ${item.prioridade ?? "—"}`}
                    />
                  )}
                  <span className="font-mono font-bold text-xs">
                    {item.numero}
                  </span>
                  {item.atrasada && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                {detailPath && (
                  <Link
                    href={detailPath(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Client */}
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.clienteNome}
              </p>

              {/* Etapa + date */}
              <div className="flex items-center justify-between gap-1 mt-1.5">
                {item.etapaAtual && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">
                    {etapaLabels[item.etapaAtual] ?? item.etapaAtual}
                  </span>
                )}
                {dt && (
                  <span
                    className={cn(
                      "text-[10px] flex items-center gap-0.5",
                      item.atrasada
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {dt}
                  </span>
                )}
              </div>

              {cardExtra && <div className="mt-1">{cardExtra(item)}</div>}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function KanbanBoard({
  columns,
  onMove,
  isLoading,
  detailPath,
  cardExtra,
}: KanbanBoardProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onMove) return;
    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;
    if (sourceCol === destCol) return;

    const itemId = parseInt(result.draggableId.replace("os-", ""), 10);
    onMove(itemId, sourceCol, destCol);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {columns.map((col) => (
          <div key={col.id} className="w-64 shrink-0 flex flex-col gap-2">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg border",
                col.bgColor,
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  col.color,
                )}
              >
                {col.label}
              </span>
              <span className={cn("text-xs font-bold tabular-nums", col.color)}>
                {col.items.length}
              </span>
            </div>
            <Droppable droppableId={col.id}>
              {(
                provided: DroppableProvided,
                snapshot: DroppableStateSnapshot,
              ) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex flex-col gap-2 min-h-[80px] rounded-lg transition-colors p-1",
                    snapshot.isDraggingOver &&
                      "bg-primary/5 ring-1 ring-primary/20",
                  )}
                >
                  {col.items.length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-center py-6 text-muted-foreground text-xs border border-dashed rounded-lg">
                      Arraste aqui
                    </div>
                  )}
                  {col.items.map((item, index) => (
                    <KanbanCard
                      key={item.id}
                      item={item}
                      index={index}
                      detailPath={detailPath}
                      cardExtra={cardExtra}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
