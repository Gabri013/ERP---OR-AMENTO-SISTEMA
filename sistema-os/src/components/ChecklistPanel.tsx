import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  osId: number;
  etapaAtual: string;
  canEdit?: boolean;
}

export function ChecklistPanel({ osId, etapaAtual, canEdit = true }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["checklist", osId],
    queryFn: () => api.get(`/os/${osId}/checklist`).then((r) => r.data?.data ?? []),
    enabled: !!osId,
  });

  const checkMut = useMutation({
    mutationFn: ({ checkId, concluido }: { checkId: number; concluido: boolean }) =>
      api.patch(`/os/${osId}/checklist/${checkId}`, { concluido }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", osId] }),
    onError: () => toast({ title: "Erro ao atualizar checklist", variant: "destructive" }),
  });

  const addMut = useMutation({
    mutationFn: (item: string) =>
      api.post(`/os/${osId}/checklist`, { etapa: etapaAtual, item }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist", osId] });
      setNewItem("");
    },
    onError: () => toast({ title: "Erro ao adicionar item", variant: "destructive" }),
  });

  const initMut = useMutation({
    mutationFn: () =>
      api.post(`/os/${osId}/checklist/inicializar`, { etapa: etapaAtual }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", osId] }),
  });

  const concluded = (items as any[]).filter((i: any) => i.concluido).length;
  const total = (items as any[]).length;
  const pct = total > 0 ? Math.round((concluded / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Checklist — {etapaAtual}
          </CardTitle>
          {total > 0 && (
            <span className={cn("text-xs font-semibold", pct === 100 ? "text-green-500" : "text-muted-foreground")}>
              {concluded}/{total} ({pct}%)
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div
              className={cn("h-1.5 rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
          </div>
        ) : total === 0 ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-xs text-muted-foreground">Nenhum item no checklist</p>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => initMut.mutate()} disabled={initMut.isPending}>
                {initMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Inicializar padrão"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {(items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-start gap-2.5 group">
                <Checkbox
                  checked={item.concluido}
                  disabled={!canEdit || checkMut.isPending}
                  onCheckedChange={(checked) =>
                    checkMut.mutate({ checkId: item.id, concluido: !!checked })
                  }
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", item.concluido && "line-through text-muted-foreground")}>
                    {item.item}
                    {item.obrigatorio && <span className="text-red-500 ml-1 text-[10px]">*</span>}
                  </p>
                  {item.concluidoEm && (
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(item.concluidoEm).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newItem.trim()) addMut.mutate(newItem.trim());
            }}
            className="flex gap-2 pt-1 border-t"
          >
            <Input
              placeholder="Novo item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="h-7 text-xs"
            />
            <Button size="sm" type="submit" disabled={!newItem.trim() || addMut.isPending} className="h-7 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
