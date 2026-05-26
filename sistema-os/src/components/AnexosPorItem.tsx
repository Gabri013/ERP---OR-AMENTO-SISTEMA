import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Modal3D } from "@/components/Modal3D";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Paperclip,
  Upload,
  Trash2,
  Download,
  Box,
  Package2,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  File,
  FileCode2,
  Database,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Type configs ──────────────────────────────────────

const TIPO_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; ext: string[] }
> = {
  stl: { label: "STL (3D)", icon: Box, color: "text-blue-400", ext: [".stl"] },
  obj: { label: "OBJ (3D)", icon: Box, color: "text-blue-400", ext: [".obj"] },
  gltf: {
    label: "GLTF (3D)",
    icon: Box,
    color: "text-purple-400",
    ext: [".gltf", ".glb"],
  },
  glb: {
    label: "GLB (3D)",
    icon: Box,
    color: "text-purple-400",
    ext: [".glb"],
  },
  dxf: {
    label: "DXF (CAD)",
    icon: FileCode2,
    color: "text-cyan-400",
    ext: [".dxf"],
  },
  dwg: {
    label: "DWG (AutoCAD)",
    icon: FileCode2,
    color: "text-cyan-400",
    ext: [".dwg"],
  },
  step: {
    label: "STEP (CAD)",
    icon: FileCode2,
    color: "text-orange-400",
    ext: [".step", ".stp"],
  },
  iges: {
    label: "IGES (CAD)",
    icon: FileCode2,
    color: "text-orange-400",
    ext: [".iges", ".igs"],
  },
  bom: {
    label: "BOM (Lista)",
    icon: Database,
    color: "text-yellow-400",
    ext: [".xlsx", ".csv", ".xls"],
  },
  pdf: {
    label: "PDF Técnico",
    icon: FileText,
    color: "text-red-400",
    ext: [".pdf"],
  },
  imagem: {
    label: "Imagem",
    icon: Image,
    color: "text-green-400",
    ext: [".png", ".jpg", ".jpeg", ".webp"],
  },
  outro: { label: "Outro", icon: File, color: "text-gray-400", ext: [] },
};

const ACCEPT_ALL =
  ".stl,.obj,.gltf,.glb,.dxf,.dwg,.step,.stp,.iges,.igs,.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.csv,.bom";
const IS_3D = ["stl", "obj", "gltf", "glb"];

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] ?? TIPO_CONFIG.outro;
}

// ─── Upload Zone ───────────────────────────────────────

function UploadZone({
  osId,
  vendaItemId,
  onSuccess,
}: {
  osId: number;
  vendaItemId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: `${file.name} muito grande (máx. 50MB)`,
            variant: "destructive",
          });
          continue;
        }

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("vendaItemId", String(vendaItemId));

        try {
          // Using XMLHttpRequest for progress tracking
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const token = localStorage.getItem("authToken") ?? "";
            const apiBase =
              (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ??
              "https://erp-backend-evq2.onrender.com";

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable)
                setProgress(Math.round((e.loaded / e.total) * 100));
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                toast({ title: `${file.name} enviado!` });
                resolve();
              } else {
                reject(new Error(xhr.responseText));
              }
            };

            xhr.onerror = () => reject(new Error("Erro de rede"));

            xhr.open("POST", `${apiBase}/api/os/${osId}/upload`);
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            xhr.send(formData);
          });

          onSuccess();
        } catch (err: any) {
          toast({
            title: `Erro ao enviar ${file.name}`,
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setUploading(false);
          setProgress(0);
        }
      }
    },
    [osId, vendaItemId, toast, onSuccess],
  );

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none",
        )}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
            <p className="text-sm font-medium">Enviando arquivo...</p>
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              {dragOver
                ? "Solte para enviar"
                : "Clique ou arraste o arquivo aqui"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              STL · OBJ · GLTF · DXF · DWG · STEP · IGES · PDF · Imagem
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Máximo 50MB por arquivo
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_ALL}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────

function ProdutoAnexoCard({
  item,
  osId,
  canEdit,
  onRefresh,
}: {
  item: any;
  osId: number;
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewer3d, setViewer3d] = useState<{
    url: string;
    nome: string;
  } | null>(null);

  const apiBase =
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ??
    "https://erp-backend-evq2.onrender.com";
  const token = localStorage.getItem("authToken") ?? "";

  const delMut = useMutation({
    mutationFn: (id: number) => api.delete(`/os/${osId}/anexos/${id}`),
    onSuccess: () => {
      onRefresh();
      toast({ title: "Arquivo removido" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const downloadFile = (anexoId: number, nome: string) => {
    const url = `${apiBase}/api/os/${osId}/anexos/${anexoId}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = nome;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const open3D = (anexoId: number, nome: string) => {
    // Build authenticated URL for the viewer
    const viewUrl = `${apiBase}/api/os/${osId}/anexos/${anexoId}/view?token=${encodeURIComponent(token)}`;
    setViewer3d({ url: viewUrl, nome });
  };

  const hasAnexos = item.anexos?.length > 0;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Package2 className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{item.descricao}</span>
              {item.codigo && (
                <Badge variant="outline" className="text-[10px]">
                  {item.codigo}
                </Badge>
              )}
              {item.tipoProduto && item.tipoProduto !== "padrao" && (
                <Badge
                  className={cn("text-[10px]", {
                    "bg-blue-500/20 text-blue-400 border-blue-500/30":
                      item.tipoProduto === "refrigeracao",
                    "bg-green-500/20 text-green-400 border-green-500/30":
                      item.tipoProduto === "mobiliario",
                    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30":
                      item.tipoProduto === "coccao",
                  })}
                >
                  {item.tipoProduto}
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
              hasAnexos && "bg-primary/20 text-primary border-primary/30",
            )}
          >
            {item.anexos?.length ?? 0} arquivo
            {item.anexos?.length !== 1 ? "s" : ""}
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* File type pills */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TIPO_CONFIG)
              .slice(0, 8)
              .map(([key, cfg]) => {
                const count = (item.anexos ?? []).filter(
                  (a: any) => a.tipo === key,
                ).length;
                const Icon = cfg.icon;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      count > 0
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground",
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {cfg.label}
                    {count > 0 && (
                      <span className="font-bold ml-0.5">{count}</span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Files list */}
          {(item.anexos ?? []).length === 0 ? (
            <div className="text-center py-3 text-muted-foreground">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-40" />
              <p className="text-xs">Nenhum arquivo. Envie abaixo.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(item.anexos ?? []).map((a: any) => {
                const cfg = getTipoConfig(a.tipo);
                const Icon = cfg.icon;
                const is3D = IS_3D.includes(a.tipo);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted/40 group"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        <span className="uppercase font-mono">{a.tipo}</span>
                        {a.tamanho && (
                          <span className="ml-1.5">
                            {formatSize(a.tamanho)}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* 3D View button */}
                    {is3D && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 shrink-0"
                        title="Visualizar 3D"
                        onClick={() => open3D(a.id, a.nome)}
                      >
                        <Box className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {/* Download button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                      title="Baixar arquivo"
                      onClick={() => downloadFile(a.id, a.nome)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {/* Delete button */}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 shrink-0 opacity-0 group-hover:opacity-100"
                        title="Remover"
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

          {/* Upload zone */}
          {canEdit &&
            (showUpload ? (
              <div className="space-y-2">
                <UploadZone
                  osId={osId}
                  vendaItemId={item.id}
                  onSuccess={() => {
                    onRefresh();
                    setShowUpload(false);
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-xs"
                  onClick={() => setShowUpload(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 gap-2 border-dashed text-xs"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Enviar arquivo para: {item.produto?.nome ?? item.descricao}
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

// ─── Main component ────────────────────────────────────

export function AnexosPorItem({
  osId,
  canEdit = true,
}: {
  osId: number;
  canEdit?: boolean;
}) {
  const qc = useQueryClient();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens-com-anexos", osId],
    queryFn: () =>
      api.get(`/os/${osId}/itens-com-anexos`).then((r) => r.data?.data ?? []),
    enabled: !!osId,
  });

  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["itens-com-anexos", osId] });
  const totalArquivos = (itens as any[]).reduce(
    (acc: number, i: any) => acc + (i.anexos?.length ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Arquivos Técnicos por Produto
          {totalArquivos > 0 && (
            <Badge variant="secondary">
              {totalArquivos} arquivo{totalArquivos !== 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Cada produto possui seus próprios arquivos: STL, DXF, DWG, STEP, PDF,
          BOM...
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (itens as any[]).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum produto nesta OS</p>
          </div>
        ) : (
          (itens as any[]).map((item) => (
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
