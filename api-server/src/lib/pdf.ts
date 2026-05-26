import PDFDocument from 'pdfkit';
import { db } from './prisma';

interface OrcamentoData {
  numero: string;
  cliente: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpjCpf?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    telefone?: string;
    email?: string;
  };
  dataOrcamento: string;
  validade?: string;
  valorTotal: number;
  desconto: number;
  itens: Array<{
    produto?: { nome: string; codigo: string };
    descricaoManual?: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  observacoes?: string;
}

interface OSData {
  numero: string;
  cliente: {
    razaoSocial: string;
    nomeFantasia?: string;
    cnpjCpf?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    telefone?: string;
  };
  dataInicio: string;
  etapaAtual: string;
  status: string;
  observacoesGerais?: string;
}

export async function generateOrcamentoPDF(orcamentoId: number): Promise<Buffer> {
  const orcamento = await db.orcamento.findUnique({
    where: { id: orcamentoId },
    include: {
      cliente: true,
      itens: {
        include: { produto: true },
      },
    },
  });

  if (!orcamento) {
    throw new Error('Orçamento não encontrado');
  }

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('ERP Cozinca - Orçamento', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Número: ${orcamento.numero}`);
    doc.text(`Data: ${new Date(orcamento.dataOrcamento).toLocaleDateString('pt-BR')}`);
    if (orcamento.validade) {
      doc.text(`Validade: ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}`);
    }
    doc.moveDown();

    // Cliente
    doc.fontSize(14).text('Cliente', { underline: true });
    doc.fontSize(12);
    doc.text(`Razão Social: ${orcamento.cliente.razaoSocial}`);
    if (orcamento.cliente.nomeFantasia) {
      doc.text(`Nome Fantasia: ${orcamento.cliente.nomeFantasia}`);
    }
    if (orcamento.cliente.cnpjCpf) {
      doc.text(`CNPJ/CPF: ${orcamento.cliente.cnpjCpf}`);
    }
    if (orcamento.cliente.endereco) {
      doc.text(`Endereço: ${orcamento.cliente.endereco}`);
    }
    if (orcamento.cliente.cidade && orcamento.cliente.estado) {
      doc.text(`${orcamento.cliente.cidade} - ${orcamento.cliente.estado}`);
    }
    if (orcamento.cliente.telefone) {
      doc.text(`Telefone: ${orcamento.cliente.telefone}`);
    }
    if (orcamento.cliente.email) {
      doc.text(`Email: ${orcamento.cliente.email}`);
    }
    doc.moveDown();

    // Itens
    doc.fontSize(14).text('Itens', { underline: true });
    doc.moveDown();

    let totalItens = 0;
    orcamento.itens.forEach((item, index) => {
      const descricao = item.produto?.nome || item.descricaoManual || 'Item sem descrição';
      const codigo = item.produto?.codigo || '-';
      const quantidade = Number(item.quantidade);
      const valorUnitario = Number(item.valorUnitario);
      const valorTotal = Number(item.valorTotal);

      doc.fontSize(10);
      doc.text(`${index + 1}. ${descricao}`);
      doc.text(`   Código: ${codigo} | Qtd: ${quantidade} | Unit: R$ ${valorUnitario.toFixed(2)} | Total: R$ ${valorTotal.toFixed(2)}`);
      doc.moveDown(0.5);

      totalItens += valorTotal;
    });

    // Totais
    doc.moveDown();
    doc.fontSize(14).text('Totais', { underline: true });
    doc.fontSize(12);
    doc.text(`Subtotal: R$ ${totalItens.toFixed(2)}`);
    doc.text(`Desconto: R$ ${Number(orcamento.desconto).toFixed(2)}`);
    doc.fontSize(16).text(`Total: R$ ${Number(orcamento.valorTotal).toFixed(2)}`, { align: 'right' });

    // Observações
    if (orcamento.observacoes) {
      doc.moveDown();
      doc.fontSize(14).text('Observações', { underline: true });
      doc.fontSize(12).text(orcamento.observacoes);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Este orçamento é válido apenas pela assinatura do responsável.', { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

    doc.end();
  });
}

export async function generateOSPDF(osId: number): Promise<Buffer> {
  const os = await db.ordemServico.findUnique({
    where: { id: osId },
    include: {
      cliente: true,
    },
  });

  if (!os) {
    throw new Error('Ordem de Serviço não encontrada');
  }

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('ERP Cozinca - Ordem de Serviço', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Número: ${os.numero}`);
    doc.text(`Data Início: ${new Date(os.dataInicio).toLocaleDateString('pt-BR')}`);
    if (os.dataTermino) {
      doc.text(`Data Término: ${new Date(os.dataTermino).toLocaleDateString('pt-BR')}`);
    }
    doc.text(`Etapa Atual: ${os.etapaAtual}`);
    doc.text(`Status: ${os.status}`);
    doc.moveDown();

    // Cliente
    doc.fontSize(14).text('Cliente', { underline: true });
    doc.fontSize(12);
    doc.text(`Razão Social: ${os.cliente.razaoSocial}`);
    if (os.cliente.nomeFantasia) {
      doc.text(`Nome Fantasia: ${os.cliente.nomeFantasia}`);
    }
    if (os.cliente.cnpjCpf) {
      doc.text(`CNPJ/CPF: ${os.cliente.cnpjCpf}`);
    }
    if (os.cliente.endereco) {
      doc.text(`Endereço: ${os.cliente.endereco}`);
    }
    if (os.cliente.cidade && os.cliente.estado) {
      doc.text(`${os.cliente.cidade} - ${os.cliente.estado}`);
    }
    if (os.cliente.telefone) {
      doc.text(`Telefone: ${os.cliente.telefone}`);
    }
    doc.moveDown();

    // Observações
    if (os.observacoesGerais) {
      doc.fontSize(14).text('Observações Gerais', { underline: true });
      doc.fontSize(12).text(os.observacoesGerais);
      doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

    doc.end();
  });
}
