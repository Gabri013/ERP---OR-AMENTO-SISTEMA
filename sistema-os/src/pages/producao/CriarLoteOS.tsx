// src/pages/producao/CriarLoteOS.tsx
import React, { useState } from 'react';
import { IndustrialTable } from '../../components/IndustrialTable/IndustrialTable';
import './CriarLoteOS.css';

export const CriarLoteOS: React.FC = () => {
  const [vendas, setVendas] = useState<any[]>([
    // Simulado
     { id: 1, numero: 'VENDA-001', cliente: 'Cliente A', valor: 1500.00, data: '27/05/2026' },
     { id: 2, numero: 'VENDA-002', cliente: 'Cliente B', valor: 3200.50, data: '27/05/2026' },
     { id: 3, numero: 'VENDA-003', cliente: 'Cliente C', valor: 890.00, data: '28/05/2026' },
  ]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  const handleCriarLote = async () => {
    try {
        /*
      const response = await fetch('/api/os-batch/criar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendaIds: selecionadas,
          fluxoId: 1,
        }),
      });
      const data = await response.json();
      alert(`✅ ${data.message}`);
      */
      alert(`✅ Lote de ${selecionadas.length} O.S. criado com sucesso!`);
      setSelecionadas([]);
    } catch (error) {
      alert('❌ Erro ao criar lote');
    }
  };

  return (
    <div className="criar-lote-container">
      <div className="criar-lote-header">
        <h1>📦 Gerar O.S. em Lote</h1>
        <p>Selecione vendas para gerar múltiplas ordens de serviço</p>
      </div>

      {selecionadas.length > 0 && (
        <div className="lote-preview">
          <h3>✨ Preview - Serão criadas {selecionadas.length} O.S.</h3>
          <div className="preview-list">
            {vendas
              .filter((v) => selecionadas.includes(v.id))
              .map((v) => (
                <div key={v.id} className="preview-item">
                  <span className="preview-venda">{v.numero}</span>
                  <span className="preview-cliente">{v.cliente}</span>
                  <span className="preview-valor">R$ {v.valor.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <IndustrialTable
        title="Vendas Disponíveis"
        columns={[
          { key: 'numero', label: 'Venda', width: '120px' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'valor', label: 'Valor', align: 'right', render: (val) => `R$ ${val.toFixed(2)}` },
          { key: 'data', label: 'Data', width: '100px' },
        ]}
        data={vendas}
        selectable
        selectedRows={selecionadas}
        onSelectChange={setSelecionadas}
      />

      <div className="lote-actions">
        <button
          onClick={handleCriarLote}
          disabled={selecionadas.length === 0}
          className="btn btn-laranja btn-large"
        >
          ✅ Criar {selecionadas.length} O.S.
        </button>
      </div>
    </div>
  );
};
