import { useRoute } from "wouter";
import { useGetOSImprimir } from "@workspace/api-client-react";
import { useEffect } from "react";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

function formatDateLong(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return "—"; }
}

const PROCESSOS_OS = [
  "Engenharia","Programação","Corte","Dobra","Tubo","Solda",
  "Mobiliário","Cocção","Refrigeração","Embalagem",
];

export default function OSPrintPage() {
  const [, params] = useRoute("/os/:id/print");
  const id = params?.id ?? "0";
  const { data: os, isLoading } = useGetOSImprimir(id);

  useEffect(() => {
    if (os) {
      document.title = `OS ${os.numero} - Cozinca`;
    }
  }, [os]);

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Carregando...</div>;
  if (!os) return <div className="p-8 text-center text-sm text-red-500">OS não encontrada.</div>;

  const item = os.itens?.[0];
  const descricaoProduto = item?.produto?.nome ?? item?.descricao ?? "—";
  const codigoProduto = item?.produto?.codigo ?? "—";
  const quantidade = item?.quantidade ?? "—";

  return (
    <div className="bg-white text-black min-h-screen p-4" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px" }}>
      <div className="max-w-4xl mx-auto border border-gray-400">
        {/* Header */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-3 w-40 align-middle">
                <div className="text-center">
                  <div className="font-bold text-lg text-orange-600">COZINCA</div>
                  <div className="text-xs text-gray-600">Soluções Industriais</div>
                </div>
              </td>
              <td className="border border-gray-400 p-3 text-center align-middle">
                <div className="text-2xl font-bold uppercase tracking-wide">ORDEM DE PRODUÇÃO</div>
              </td>
              <td className="border border-gray-400 p-3 w-36 align-middle text-right">
                <div className="text-xs text-gray-500">Nº da Ordem de prod...</div>
                <div className="text-2xl font-bold mt-1">{os.numero}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Descrição do produto */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">
                <div className="text-xs text-gray-500 mb-1">Descrição do produto</div>
                <div className="font-bold text-sm uppercase">{descricaoProduto}</div>
                {item?.produto?.descricao && (
                  <div className="text-xs text-gray-600 mt-0.5">{item.produto.descricao}</div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Código, NS, Liberação, Prazo, Qtde */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">Código do Produto</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">N.S.:</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">Liberação OP</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">Prazo</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">Qtde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1.5 font-bold">{codigoProduto}</td>
              <td className="border border-gray-400 p-1.5"></td>
              <td className="border border-gray-400 p-1.5 font-semibold">
                Data da emissão: {formatDateLong(os.dataEmissao)}
              </td>
              <td className="border border-gray-400 p-1.5 font-semibold">{formatDate(os.dataTermino)}</td>
              <td className="border border-gray-400 p-1.5 font-bold text-center">{quantidade} UN</td>
            </tr>
          </tbody>
        </table>

        {/* Pedido e Cliente */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1.5 w-1/2">
                <span className="text-xs text-gray-500">Nº do pedido: </span>
                <span className="font-bold">{os.venda?.numeroPedido ?? os.venda?.numero ?? "—"}</span>
              </td>
              <td className="border border-gray-400 p-1.5">
                <span className="text-xs text-gray-500">Emissão do pedido: </span>
                <span className="font-bold">{formatDateLong(os.venda?.dataVenda ?? os.dataEmissao)}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5" colSpan={2}>
                <span className="text-xs text-gray-500">Cliente: </span>
                <span className="font-bold uppercase">{os.cliente?.razaoSocial ?? "—"}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1.5" colSpan={2}>
                <span className="text-xs text-gray-500">Inform. Adicion: </span>
                <span className="font-semibold">{os.observacoesGerais ?? "—"}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Processos de produção */}
        <table className="w-full border-collapse mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1.5 text-xs font-semibold w-6">#</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">PROCESSO</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">INÍCIO</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">TÉRMINO</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">OBS</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">RESPONSÁVEL</th>
              <th className="border border-gray-400 p-1.5 text-left text-xs font-semibold">LIDER</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSOS_OS.map((processo, i) => (
              <tr key={i}>
                <td className="border border-gray-400 p-2 text-center text-xs">{i + 1}</td>
                <td className="border border-gray-400 p-2 text-xs">{processo}</td>
                <td className="border border-gray-400 p-2 h-7"></td>
                <td className="border border-gray-400 p-2 h-7"></td>
                <td className="border border-gray-400 p-2 h-7"></td>
                <td className="border border-gray-400 p-2 h-7"></td>
                <td className="border border-gray-400 p-2 h-7"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Controle de revisão */}
        <div className="border border-gray-400 p-2 mt-2">
          <div className="font-semibold text-xs mb-2">CONTROLE DE REVISÃO DE PRAZO O.P.</div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1.5 text-xs font-semibold">REVISÃO</th>
                <th className="border border-gray-400 p-1.5 text-xs font-semibold">DATA</th>
                <th className="border border-gray-400 p-1.5 text-xs font-semibold">NOVO PRAZO</th>
                <th className="border border-gray-400 p-1.5 text-xs font-semibold">MOTIVO / JUSTIFICATIVA</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2].map(n => (
                <tr key={n}>
                  <td className="border border-gray-400 p-2 h-8 text-center text-xs">{n}</td>
                  <td className="border border-gray-400 p-2 h-8"></td>
                  <td className="border border-gray-400 p-2 h-8"></td>
                  <td className="border border-gray-400 p-2 h-8"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observação */}
        <div className="border border-gray-400 p-2 mt-2">
          <div className="font-semibold text-xs mb-2">OBSERVAÇÃO</div>
          <div className="space-y-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border-b border-gray-200 h-6"></div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-2 text-xs text-gray-500 border-t border-gray-400 mt-1">
          <span>{new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span>Página 1 de 1</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          @page { margin: 1cm; size: A4; }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-btn {
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: #1a1a2e;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            z-index: 1000;
          }
        }
      `}</style>
      <button className="print-btn no-print" onClick={() => window.print()}>
        🖨️ Imprimir
      </button>
    </div>
  );
}
