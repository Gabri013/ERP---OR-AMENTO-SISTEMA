import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Paperclip, Plus, Trash2, ExternalLink, FileText, Image, File } from "lucide-react";

const TIPOS = [
  { value: "pdf", label: "PDF" },
  { value: "dxf", label: "DXF" },
  { value: "dwg", label: "DWG" },
  { value: "step", label: "STEP" },
  { value: "imagem", label: "Imagem" },
  { value: "foto", label: "Foto" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

const tipoIcon: Record<string, React.ElementType> = {
  pdf: FileText,
  imagem: Image,
  foto: Image,
  default: File,
};

interface Props {
  osId: number;
  canEdit?: boolean;
}

export function AnexosPanel({ osId, canEdit = true }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ nome: "", url: "", tipo: "pdf", descricao: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: anexos = [], isLoading } = useQuery({
    queryKey: ["anexos", osId],
    queryFn: () => api.get(`/os/${osId}/anexos`).then((r) => r.data?.data ?? []),
    enabled: !!osId,
  });

  const addMut = useMutation({
    mutationFn: () => api.post(`/os/${osId}/anexos`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anexos", osId] });
      setForm({ nome: "", url: "", tipo: "pdf", descricao: "" });
      setShowForm(false);
      toast({ title: "Anexo adicionado!" });
    },
    onError: () => toast({ title: "Erro ao adicionar anexo", variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => api.delete(`/os/${osId}/anexos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anexos", osId] }),
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Anexos
            {(anexos as any[]).length > 0 && (
              <span className="text-xs text-muted-foreground">({(anexos as any[]).length})</span>
            )}
          </CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && canEdit && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nome do arquivo"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="h-8 text-xs"
              />
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="URL do arquivo (Google Drive, Dropbox, etc.)"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Descrição (opcional)"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!form.nome || !form.url || addMut.isPending}
                onClick={() => addMut.mutate()}
              >
                Salvar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : (anexos as any[]).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum anexo</p>
        ) : (
          <div className="space-y-2">
            {(anexos as any[]).map((a: any) => {
              const Icon = tipoIcon[a.tipo] ?? tipoIcon.default;
              return (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 group">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{a.nome}</p>
                    {a.descricao && <p className="text-[10px] text-muted-foreground truncate">{a.descricao}</p>}
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase bg-muted px-1 py-0.5 rounded shrink-0">
                    {a.tipo}
                  </span>
                  <a href={a.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                      onClick={() => delMut.mutate(a.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
