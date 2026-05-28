// src/pages/producao/EtiquetasPage.tsx
import React, { useState, useEffect } from 'react';
import { IndustrialTable } from '../../components/IndustrialTable/IndustrialTable';
import QRCode from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import './Etiqueta.css';

export const EtiquetasPage: React.FC = () => {
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [previewOS, setPreviewOS] = useState<number>();

  const generateEtiqueta = () => {
    const element = document.getElementById('etiqueta-print');
    if (element) {
      const printWindow = window.open('', '', 'width=1024,height=768');
      if (printWindow) {
        const styles = Array.from(document.styleSheets)
          .map(styleSheet => {
            try {
              return Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('');
            } catch (e) {
              console.log('Access to stylesheet %s is denied. Ignoring.', styleSheet.href);
              return '';
            }
          })
          .join('\n');

        printWindow.document.write('<html><head><title>Imprimir Etiqueta</title>');
        printWindow.document.write(`<style>${styles}</style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <div className="etiquetas-page">
      <div className="etiquetas-header">
        <h1>🏷️ Gerador de Etiquetas</h1>
        <div className="etiquetas-controls">
          <select onChange={(e) => {}} className="format-select">
            <option>Formato 100x150mm</option>
            <option>Formato 50x75mm</option>
          </select>
          <button
            onClick={generateEtiqueta}
            disabled={selecionadas.length === 0}
            className="btn btn-laranja"
          >
            🖨️ Imprimir {selecionadas.length} Etiqueta{selecionadas.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <IndustrialTable
        title="Ordens de Serviço"
        columns={[
          {
            key: 'numero',
            label: 'O.S.',
            width: '120px',
            render: (val) => <span style={{ fontWeight: 'bold', color: '#FF8C00', fontFamily: 'monospace' }}>{val}</span>,
          },
          { key: 'cliente', label: 'Cliente', render: (_, row: any) => row.cliente?.razaoSocial },
          { key: 'produto', label: 'Produto' },
          { key: 'quantidade', label: 'Qtd', align: 'center' },
          { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        ]}
        data={[
          // Dados simulados
          {
            id: 1,
            numero: 'OS-001',
            cliente: { razaoSocial: 'Cliente A' },
            produto: 'Produto XYZ',
            quantidade: 50,
            status: 'em_producao',
          },
           {
            id: 2,
            numero: 'OS-002',
            cliente: { razaoSocial: 'Cliente B' },
            produto: 'Produto ABC',
            quantidade: 100,
            status: 'pendente',
          },
        ]}
        selectable
        selectedRows={selecionadas}
        onSelectChange={setSelecionadas}
        onRowClick={(row) => setPreviewOS(row.id)}
      />

      {/* PREVIEW */}
      {previewOS && (
        <div className="etiqueta-preview-container">
          <h3>Preview da Etiqueta</h3>
          <div id="etiqueta-print" className="etiqueta-preview">
            <Etiqueta osId={previewOS} />
          </div>
        </div>
      )}
    </div>
  );
};

interface EtiquetaProps {
  osId: number;
}

function Etiqueta({ osId }: EtiquetaProps) {
  // Dados simulados
  const dados = {
    id: osId,
    numero: `OS-00${osId}`,
    cliente: `Cliente ${osId === 1 ? 'A' : 'B'}`,
    produto: `Produto ${osId === 1 ? 'XYZ' : 'ABC'}`,
    quantidade: osId === 1 ? 50 : 100,
    data: new Date().toLocaleDateString('pt-BR'),
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      JsBarcode(`#barcode-${osId}`, dados.numero, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [osId, dados.numero]);

  return (
    <div className="etiqueta">
      <div className="etiqueta-header">
        <div className="etiqueta-logo">
          🏭 COZINCA
        </div>
        <div className="etiqueta-numero">{dados.numero}</div>
      </div>

      <div className="etiqueta-info">
        <div className="info-row">
          <span className="info-label">Cliente:</span>
          <span className="info-value">{dados.cliente}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Produto:</span>
          <span className="info-value">{dados.produto}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Quantidade:</span>
          <span className="info-value">{dados.quantidade} un</span>
        </div>
        <div className="info-row">
          <span className="info-label">Data:</span>
          <span className="info-value">{dados.data}</span>
        </div>
      </div>

      <div className="etiqueta-codigos">
        <div className="qrcode-container">
          <QRCode
            value={JSON.stringify({
              os: dados.numero,
              cliente: dados.cliente,
              qtd: dados.quantidade,
            })}
            size={100}
            level="H"
            includeMargin
          />
        </div>
        <div className="barcode-container">
          <svg id={`barcode-${osId}`} />
        </div>
      </div>

      <div className="etiqueta-footer">
        Etiqueta gerada em {new Date().toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    pendente: '#6B7280',
    em_producao: '#007BFF',
    retrabalho: '#FFC107',
    concluida: '#28A745',
  };
  const text = status.replace('_', ' ').toUpperCase();

  return (
    <span
      style={{
        background: colors[status] || '#6B7280',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
      }}
    >
      {text}
    </span>
  );
}
