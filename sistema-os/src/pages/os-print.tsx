import { useRoute } from "wouter";
import { useGetOSImprimir } from "@workspace/api-client-react";
import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

function formatDateLong(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const PROCESSOS_OS = [
  "Programação",
  "Engenharia",
  "Corte",
  "Dobra",
  "Tubo",
  "Solda",
  "Cocção",
  "Refrigeração",
  "Mobiliário",
  "Montagem",
  "Revisão",
  "Embalagem",
  "Expedição",
];

export default function OSPrintPage() {
  const [, params] = useRoute("/os/:id/print");
  const id = params?.id ?? "0";
  const { data: os, isLoading } = useGetOSImprimir(id);

  const qrUrl = `${window.location.origin}/os/${id}`;

  useEffect(() => {
    if (os) document.title = `OS ${os.numero} - Cozinca`;
  }, [os]);

  if (isLoading)
    return (
      <div className="p-8 text-center text-sm text-gray-500">Carregando...</div>
    );
  if (!os)
    return (
      <div className="p-8 text-center text-sm text-red-500">
        OS não encontrada.
      </div>
    );

  const item = os.itens?.[0];
  const descricaoProduto = item?.produto?.nome ?? item?.descricao ?? "—";
  const codigoProduto = item?.produto?.codigo ?? "—";
  const quantidade = item?.quantidade ?? "—";

  return (
    <div
      className="bg-white text-black min-h-screen p-4"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "11px" }}
    >
      <div className="max-w-4xl mx-auto border border-gray-400">
        {/* Header */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 w-40 align-middle text-center">
                <div className="font-black text-2xl text-orange-600 tracking-tight">
                  COZINCA
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">
                  Soluções Industriais
                </div>
              </td>
              <td className="border border-gray-400 p-3 text-center align-middle">
                <div className="text-xl font-bold uppercase tracking-widest">
                  ORDEM DE PRODUÇÃO
                </div>
              </td>
              <td className="border border-gray-400 p-2 w-36 align-middle">
                <div className="text-right">
                  <div className="text-[9px] text-gray-500">Nº da Ordem</div>
                  <div className="text-2xl font-bold">{os.numero}</div>
                </div>
                {/* QR Code */}
                <div className="flex justify-end mt-1">
                  <QRCodeSVG value={qrUrl} size={52} level="M" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Produto */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">
                <div className="text-[9px] text-gray-500 mb-0.5">
                  Descrição do produto
                </div>
                <div className="font-bold text-sm uppercase">
                  {descricaoProduto}
                </div>
                {item?.produto?.descricao && (
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {item.produto.descricao}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Código, NS, Liberação, Prazo, Qtde */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1.5 text-left text-[10px] font-semibold">
                Código do Produto
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[10px] font-semibold">
                N.S.:
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[10px] font-semibold">
                Liberação OP
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[10px] font-semibold">
                Prazo
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[10px] font-semibold">
                Qtde
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1.5 font-bold">
                {codigoProduto}
              </td>
              <td className="border border-gray-400 p-1.5"></td>
              <td className="border border-gray-400 p-1.5 font-semibold text-[10px]">
                Data da emissão: {formatDateLong(os.dataEmissao)}
              </td>
              <td className="border border-gray-400 p-1.5 font-semibold">
                {formatDate(os.dataTermino)}
              </td>
              <td className="border border-gray-400 p-1.5 font-bold text-center">
                {quantidade} UN
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pedido e Cliente */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1.5 w-1/2">
                <span className="text-[9px] text-gray-500">Nº do pedido: </span>
                <span className="font-bold">
                  {os.venda?.numeroPedido ?? os.venda?.numero ?? "—"}
                </span>
              </td>
              <td className="border border-gray-400 p-1.5">
                <span className="text-[9px] text-gray-500">Emissão: </span>
                <span className="font-bold">
                  {formatDateLong(os.venda?.dataVenda ?? os.dataEmissao)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5" colSpan={2}>
                <span className="text-[9px] text-gray-500">Cliente: </span>
                <span className="font-bold uppercase">
                  {os.cliente?.razaoSocial ?? "—"}
                </span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5" colSpan={2}>
                <span className="text-[9px] text-gray-500">
                  Inform. Adicion.:{" "}
                </span>
                <span className="font-semibold">
                  {os.observacoesGerais ?? "—"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Processos */}
        <table className="w-full border-collapse mt-1">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1.5 text-[9px] font-semibold w-6">
                #
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold w-28">
                PROCESSO
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold">
                INÍCIO
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold">
                TÉRMINO
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold">
                OBS
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold">
                RESPONSÁVEL
              </th>
              <th className="border border-gray-400 p-1.5 text-left text-[9px] font-semibold">
                LÍDER
              </th>
            </tr>
          </thead>
          <tbody>
            {PROCESSOS_OS.map((processo, i) => {
              const etapaData = os.etapas?.find((e: any) =>
                e.etapa
                  .toLowerCase()
                  .includes(processo.toLowerCase().slice(0, 4)),
              );
              return (
                <tr key={i}>
                  <td className="border border-gray-400 p-1.5 text-center text-[9px]">
                    {i + 1}
                  </td>
                  <td className="border border-gray-400 p-1.5 text-[10px] font-medium">
                    {processo}
                  </td>
                  <td className="border border-gray-400 p-1.5 h-7 text-[9px]">
                    {etapaData?.dataInicio
                      ? formatDate(etapaData.dataInicio)
                      : ""}
                  </td>
                  <td className="border border-gray-400 p-1.5 h-7 text-[9px]">
                    {etapaData?.dataFim ? formatDate(etapaData.dataFim) : ""}
                  </td>
                  <td className="border border-gray-400 p-1.5 h-7"></td>
                  <td className="border border-gray-400 p-1.5 h-7 text-[9px]">
                    {etapaData?.responsavel ?? ""}
                  </td>
                  <td className="border border-gray-400 p-1.5 h-7 text-[9px]">
                    {etapaData?.lider ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Revisão */}
        <div className="border border-gray-400 p-2 mt-1">
          <div className="font-semibold text-[10px] mb-1">
            CONTROLE DE REVISÃO DE PRAZO O.P.
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {[
                  "REVISÃO",
                  "DATA",
                  "NOVO PRAZO",
                  "MOTIVO / JUSTIFICATIVA",
                ].map((h) => (
                  <th
                    key={h}
                    className="border border-gray-400 p-1.5 text-[9px] font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((n) => (
                <tr key={n}>
                  <td className="border border-gray-400 p-2 h-7 text-center text-[9px]">
                    {n}
                  </td>
                  <td className="border border-gray-400 p-2 h-7"></td>
                  <td className="border border-gray-400 p-2 h-7"></td>
                  <td className="border border-gray-400 p-2 h-7"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observação */}
        <div className="border border-gray-400 p-2 mt-1">
          <div className="font-semibold text-[10px] mb-1">OBSERVAÇÃO</div>
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-gray-200 h-5"></div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-2 text-[9px] text-gray-500 border-t border-gray-400">
          <span>{new Date().toLocaleString("pt-BR")}</span>
          <span className="font-mono">
            {os.numero} — QR: {qrUrl.slice(-20)}
          </span>
          <span>Página 1 de 1</span>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.8cm; size: A4; }
          .no-print { display: none !important; }
        }
      `}</style>
      <button
        className="no-print fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-800 z-50"
        onClick={() => window.print()}
      >
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  );
}
