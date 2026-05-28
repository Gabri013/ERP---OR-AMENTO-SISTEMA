import { QRCodeSVG } from "qrcode.react";
import { Barcode, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LabelOrder = {
  id: number;
  number: string;
  client: string;
  product?: string;
  quantity?: number;
  currentSector: string;
};

export function IndustrialLabelPreview({ orders }: { orders: LabelOrder[] }) {
  const order = orders[0];

  if (!order) {
    return (
      <div className="rounded-[8px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Nenhuma O.S. encontrada no banco para gerar etiqueta.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[8px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Fila de impressao industrial</h2>
            <p className="text-xs text-slate-500">Lote com QR Code, codigo de barras e rastreabilidade por setor.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-[6px]">
              <RotateCcw className="h-4 w-4" />
              Reimprimir
            </Button>
            <Button size="sm" className="rounded-[6px] bg-[#003D7A]">
              <Printer className="h-4 w-4" />
              Zebra/Epson
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {orders.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-[6px] border border-slate-200 p-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{item.number}</p>
                <p className="text-xs text-slate-500">{item.client}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-[6px]">
                Preview
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[8px] border border-slate-300 bg-white p-4 shadow-sm">
        <div className="border-2 border-slate-950 p-3">
          <div className="flex items-start justify-between gap-3 border-b-2 border-slate-950 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">COZINCA INDUSTRIAL</p>
              <h3 className="text-xl font-black text-slate-950">{order.number}</h3>
              <p className="text-xs font-semibold text-slate-700">{order.client}</p>
            </div>
            <QRCodeSVG value={`${order.number}|${order.client}|${order.currentSector}`} size={82} />
          </div>
          <div className="space-y-2 py-3 text-xs">
            <div className="grid grid-cols-[86px_1fr] gap-2">
              <span className="font-bold">Produto</span>
              <span>{order.product ?? "Produto sob encomenda"}</span>
            </div>
            <div className="grid grid-cols-[86px_1fr] gap-2">
              <span className="font-bold">Quantidade</span>
              <span>{order.quantity ?? 1} un</span>
            </div>
            <div className="grid grid-cols-[86px_1fr] gap-2">
              <span className="font-bold">Setor atual</span>
              <span>{order.currentSector}</span>
            </div>
            <div className="grid grid-cols-[86px_1fr] gap-2">
              <span className="font-bold">Data</span>
              <span>{new Date().toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="border-t-2 border-slate-950 pt-3">
            <Barcode className="h-10 w-full text-slate-950" />
            <p className="text-center font-mono text-xs font-bold">*{order.number}-SETOR-{order.currentSector.toUpperCase()}*</p>
          </div>
        </div>
      </div>
    </div>
  );
}
