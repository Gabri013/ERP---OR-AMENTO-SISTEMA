import { useState } from "react";
import { Modal3D } from "@/components/Modal3D";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Paperclip,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Image,
  File,
  Box,
  Package2,
  ChevronDown,
  ChevronUp,
  FileCode2,
  BookOpen,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIPOS = [
  { value: "pdf", label: "PDF Técnico", icon: FileText, color: "text-red-400" },
  {
    value: "dxf",
    label: "DXF (Corte)",
    icon: FileCode2,
    color: "text-blue-400",
  },
  { value: "dwg", label: "DWG (CAD)", icon: FileCode2, color: "text-cyan-400" },
  { value: "step", label: "STEP (3D)", icon: Box, color: "text-purple-400" },
  { value: "3d", label: "3D / STL", icon: Box, color: "text-indigo-400" },
  {
    value: "bom",
    label: "BOM (Lista Mat)",
    icon: Database,
    color: "text-orange-400",
  },
  { value: "imagem", label: "Imagem", icon: Image, color: "text-green-400" },
  {
    value: "foto",
    label: "Foto produção",
    icon: Image,
    color: "text-teal-400",
  },
  {
    value: "manual",
    label: "Manual",
    icon: BookOpen,
    color: "text-yellow-400",
  },
  { value: "outro", label: "Outro", icon: File, color: "text-gray-400" },
];

function getTipoInfo(tipo: string) {
  return TIPOS.find((t) => t.value === tipo) ?? TIPOS[TIPOS.length - 1];
}

interface AnexoItem {
  id: number;
  nome: string;
  url: string;
  tipo: string;
  descricao?: string;
  createdAt: string;
}

interface OsItem {
  id: number;
  descricao: string;
  codigo?: string | null;
  quantidade: number;
  produto?: { id: number; nome: string; codigo?: string | null } | null;
  anexos: AnexoItem[];
}

function AddAnexoForm({
  osId,
  vendaItemId,
  onClose,
  onSuccess,
}: {
  osId: number;
  vendaItemId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    nome: "",
    url: "",
    tipo: "pdf",
    descricao: "",
  });

  const addMut = useMutation({
    mutationFn: () => api.post(`/os/${osId}/anexos`, { ...form, vendaItemId }),
    onSuccess: () => {
      onSuccess();
      onClose();
      toast({ title: "Arquivo adicionado!" });
    },
    onError: () =>
      toast({ title: "Erro ao adicionar arquivo", variant: "destructive" }),
  });

  return (
    <div className="border rounded-lg p-3 bg-muted/20 space-y-2 mt-2">
      <p className="text-xs font-semibold text-muted-foreground">
        Novo arquivo para este produto
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Nome do arquivo (ex: chapa_corte.dxf)"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          className="h-8 text-xs col-span-2"
        />
        <Select
          value={form.tipo}
          onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <span className={cn("font-medium", t.color)}>{t.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Descrição (opcional)"
          value={form.descricao}
          onChange={(e) =>
            setForm((f) => ({ ...f, descricao: e.target.value }))
          }
          className="h-8 text-xs"
        />
        <Input
          placeholder="URL (Google Drive, Dropbox, servidor...)"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          className="h-8 text-xs col-span-2"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!form.nome.trim() || !form.url.trim() || addMut.isPending}
          onClick={() => addMut.mutate()}
        >
          {addMut.isPending ? "Salvando..." : "Salvar arquivo"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function ProdutoAnexoCard({
  item,
  osId,
  canEdit,
  onRefresh,
}: {
  item: OsItem;
  osId: number;
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewer3d, setViewer3d] = useState<{
    url: string;
    nome: string;
  } | null>(null);

  const delMut = useMutation({
    mutationFn: (anexoId: number) =>
      api.delete(`/os/${osId}/anexos/${anexoId}`),
    onSuccess: () => {
      onRefresh();
      toast({ title: "Arquivo removido" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const hasAnexos = item.anexos.length > 0;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Product header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Package2 className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">
                {item.descricao}
              </span>
              {item.codigo && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 shrink-0"
                >
                  {item.codigo}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Qtd: {item.quantidade}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={hasAnexos ? "default" : "outline"}
            className={cn(
              "text-[10px]",
              hasAnexos ? "bg-primary/20 text-primary border-primary/30" : "",
            )}
          >
            {item.anexos.length}{" "}
            {item.anexos.length === 1 ? "arquivo" : "arquivos"}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Files */}
      {expanded && (
        <div className="p-3 space-y-2">
          {/* File type badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {TIPOS.slice(0, 6).map((tipo) => {
              const count = item.anexos.filter(
                (a) => a.tipo === tipo.value,
              ).length;
              const Icon = tipo.icon;
              return (
                <div
                  key={tipo.value}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                    count > 0
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {tipo.label}
                  {count > 0 && <span className="font-bold">{count}</span>}
                </div>
              );
            })}
          </div>

          {/* Files list */}
          {item.anexos.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum arquivo para este produto
            </p>
          ) : (
            <div className="space-y-1.5">
              {item.anexos.map((anexo) => {
                const tipoInfo = getTipoInfo(anexo.tipo);
                const Icon = tipoInfo.icon;
                return (
                  <div
                    key={anexo.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg border hover:bg-muted/40 group transition-colors"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", tipoInfo.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {anexo.nome}
                      </p>
                      {anexo.descricao && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {anexo.descricao}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 shrink-0 font-mono uppercase",
                        tipoInfo.color,
                      )}
                    >
                      {anexo.tipo}
                    </Badge>
                    <a
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        title="Abrir arquivo"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                    {["stl", "obj", "gltf", "glb", "3d", "step"].includes(
                      anexo.tipo,
                    ) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        title="Visualizar 3D"
                        onClick={() =>
                          setViewer3d({ url: anexo.url, nome: anexo.nome })
                        }
                      >
                        <Box className="h-3 w-3" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => delMut.mutate(anexo.id)}
                        title="Remover arquivo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add form */}
          {canEdit &&
            (showAddForm ? (
              <AddAnexoForm
                osId={osId}
                vendaItemId={item.id}
                onClose={() => setShowAddForm(false)}
                onSuccess={onRefresh}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs gap-1.5 border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3" />
                Adicionar arquivo para {item.produto?.nome ?? item.descricao}
              </Button>
            ))}
        </div>
      )}
      {viewer3d && (
        <Modal3D
          open={!!viewer3d}
          onClose={() => setViewer3d(null)}
          url={viewer3d.url}
          nome={viewer3d.nome}
        />
      )}
    </div>
  );
}

interface AnexosPorItemProps {
  osId: number;
  canEdit?: boolean;
}

export function AnexosPorItem({ osId, canEdit = true }: AnexosPorItemProps) {
  const qc = useQueryClient();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens-com-anexos", osId],
    queryFn: () =>
      api.get(`/os/${osId}/itens-com-anexos`).then((r) => r.data?.data ?? []),
    enabled: !!osId,
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["itens-com-anexos", osId] });

  const totalAnexos = (itens as OsItem[]).reduce(
    (acc, i) => acc + i.anexos.length,
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Arquivos por Produto
          {totalAnexos > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalAnexos} arquivo{totalAnexos !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cada produto possui seus próprios arquivos: DXF, PDF, 3D, BOM, etc.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (itens as OsItem[]).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum produto encontrado nesta OS</p>
            <p className="text-xs mt-1">
              Esta OS precisa estar vinculada a uma venda com itens
            </p>
          </div>
        ) : (
          (itens as OsItem[]).map((item) => (
            <ProdutoAnexoCard
              key={item.id}
              item={item}
              osId={osId}
              canEdit={canEdit}
              onRefresh={refresh}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
