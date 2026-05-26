import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Viewer3D } from "@/components/Viewer3D";
import { Box } from "lucide-react";

interface Modal3DProps {
  open: boolean;
  onClose: () => void;
  url: string;
  nome?: string;
  format?: string;
}

export function Modal3D({ open, onClose, url, nome, format }: Modal3DProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl w-full p-0 bg-[#0e1117] border-border overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            <Box className="inline h-4 w-4 mr-1 align-middle" />
            Visualizador 3D — {nome}
          </DialogTitle>
        </DialogHeader>
        <Viewer3D
          url={url}
          nome={nome}
          format={format}
          height={620}
          className="rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
