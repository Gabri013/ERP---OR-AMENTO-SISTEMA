-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('entrada', 'saida', 'reserva', 'consumo_os', 'inventario', 'ajuste', 'estorno');

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpjCpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "homologado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "especificacao" TEXT,
    "estoqueMinimo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "estoqueAtual" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "estoqueReservado" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "localizacao" TEXT,
    "lotePadrao" TEXT,
    "custoMedio" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "fornecedorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimentacao" (
    "id" SERIAL NOT NULL,
    "materialId" INTEGER NOT NULL,
    "osId" INTEGER,
    "usuarioId" INTEGER,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "lote" TEXT,
    "localizacao" TEXT,
    "documento" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstoqueMovimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoEstrutura" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "perdaPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "revisao" TEXT NOT NULL DEFAULT 'A',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoEstrutura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoRoteiro" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "operacao" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "tempoPadraoMin" INTEGER NOT NULL,
    "setupMin" INTEGER NOT NULL DEFAULT 0,
    "recurso" TEXT,
    "instrucoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoRoteiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngenhariaRevisao" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "revisao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "descricao" TEXT,
    "desenhoUrl" TEXT,
    "solidworksUrl" TEXT,
    "pdfUrl" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngenhariaRevisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacidadeSetor" (
    "id" SERIAL NOT NULL,
    "setorId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "turno" TEXT NOT NULL DEFAULT 'A',
    "capacidadeMin" INTEGER NOT NULL,
    "cargaPlanejadaMin" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'operando',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacidadeSetor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoProducao" (
    "id" SERIAL NOT NULL,
    "osId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "dataPlanejada" TIMESTAMP(3) NOT NULL,
    "inicioPrevisto" TIMESTAMP(3),
    "fimPrevisto" TIMESTAMP(3),
    "prioridade" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "cargaMin" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoProducao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApontamentoProducao" (
    "id" SERIAL NOT NULL,
    "osId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "operacao" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "tempoMin" INTEGER,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "retrabalho" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApontamentoProducao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspecaoQualidade" (
    "id" SERIAL NOT NULL,
    "osId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "etapa" TEXT NOT NULL,
    "resultado" TEXT NOT NULL DEFAULT 'pendente',
    "checklist" JSONB,
    "observacao" TEXT,
    "inspecionadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspecaoQualidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NaoConformidade" (
    "id" SERIAL NOT NULL,
    "osId" INTEGER NOT NULL,
    "inspecaoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL DEFAULT 'media',
    "descricao" TEXT NOT NULL,
    "acaoCorretiva" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NaoConformidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraPedido" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "fornecedorId" INTEGER,
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previsaoEntrega" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "valorTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompraPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraPedidoItem" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "materialId" INTEGER,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "valorUnitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompraPedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtiquetaIndustrial" (
    "id" SERIAL NOT NULL,
    "osId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'os',
    "setorAtual" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "impressora" TEXT,
    "impressoEm" TIMESTAMP(3),
    "reimpressao" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtiquetaIndustrial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistenciaTecnicaChamado" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "osId" INTEGER,
    "clienteId" INTEGER,
    "usuarioId" INTEGER,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "prioridade" TEXT NOT NULL DEFAULT 'normal',
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistenciaTecnicaChamado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fornecedor_cnpjCpf_idx" ON "Fornecedor"("cnpjCpf");

-- CreateIndex
CREATE INDEX "Fornecedor_status_idx" ON "Fornecedor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Material_codigo_key" ON "Material"("codigo");

-- CreateIndex
CREATE INDEX "Material_categoria_idx" ON "Material"("categoria");

-- CreateIndex
CREATE INDEX "Material_status_idx" ON "Material"("status");

-- CreateIndex
CREATE INDEX "Material_fornecedorId_idx" ON "Material"("fornecedorId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_materialId_idx" ON "EstoqueMovimentacao"("materialId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_osId_idx" ON "EstoqueMovimentacao"("osId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_tipo_idx" ON "EstoqueMovimentacao"("tipo");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_createdAt_idx" ON "EstoqueMovimentacao"("createdAt");

-- CreateIndex
CREATE INDEX "ProdutoEstrutura_produtoId_idx" ON "ProdutoEstrutura"("produtoId");

-- CreateIndex
CREATE INDEX "ProdutoEstrutura_materialId_idx" ON "ProdutoEstrutura"("materialId");

-- CreateIndex
CREATE INDEX "ProdutoRoteiro_produtoId_idx" ON "ProdutoRoteiro"("produtoId");

-- CreateIndex
CREATE INDEX "ProdutoRoteiro_setorId_idx" ON "ProdutoRoteiro"("setorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoRoteiro_produtoId_sequencia_key" ON "ProdutoRoteiro"("produtoId", "sequencia");

-- CreateIndex
CREATE INDEX "EngenhariaRevisao_status_idx" ON "EngenhariaRevisao"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EngenhariaRevisao_produtoId_revisao_key" ON "EngenhariaRevisao"("produtoId", "revisao");

-- CreateIndex
CREATE INDEX "CapacidadeSetor_data_idx" ON "CapacidadeSetor"("data");

-- CreateIndex
CREATE INDEX "CapacidadeSetor_status_idx" ON "CapacidadeSetor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CapacidadeSetor_setorId_data_turno_key" ON "CapacidadeSetor"("setorId", "data", "turno");

-- CreateIndex
CREATE INDEX "PlanoProducao_dataPlanejada_idx" ON "PlanoProducao"("dataPlanejada");

-- CreateIndex
CREATE INDEX "PlanoProducao_status_idx" ON "PlanoProducao"("status");

-- CreateIndex
CREATE INDEX "PlanoProducao_setorId_idx" ON "PlanoProducao"("setorId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoProducao_osId_setorId_sequencia_key" ON "PlanoProducao"("osId", "setorId", "sequencia");

-- CreateIndex
CREATE INDEX "ApontamentoProducao_osId_idx" ON "ApontamentoProducao"("osId");

-- CreateIndex
CREATE INDEX "ApontamentoProducao_setorId_idx" ON "ApontamentoProducao"("setorId");

-- CreateIndex
CREATE INDEX "ApontamentoProducao_usuarioId_idx" ON "ApontamentoProducao"("usuarioId");

-- CreateIndex
CREATE INDEX "ApontamentoProducao_status_idx" ON "ApontamentoProducao"("status");

-- CreateIndex
CREATE INDEX "InspecaoQualidade_osId_idx" ON "InspecaoQualidade"("osId");

-- CreateIndex
CREATE INDEX "InspecaoQualidade_resultado_idx" ON "InspecaoQualidade"("resultado");

-- CreateIndex
CREATE INDEX "NaoConformidade_osId_idx" ON "NaoConformidade"("osId");

-- CreateIndex
CREATE INDEX "NaoConformidade_status_idx" ON "NaoConformidade"("status");

-- CreateIndex
CREATE INDEX "NaoConformidade_severidade_idx" ON "NaoConformidade"("severidade");

-- CreateIndex
CREATE UNIQUE INDEX "CompraPedido_numero_key" ON "CompraPedido"("numero");

-- CreateIndex
CREATE INDEX "CompraPedido_status_idx" ON "CompraPedido"("status");

-- CreateIndex
CREATE INDEX "CompraPedido_fornecedorId_idx" ON "CompraPedido"("fornecedorId");

-- CreateIndex
CREATE INDEX "CompraPedidoItem_pedidoId_idx" ON "CompraPedidoItem"("pedidoId");

-- CreateIndex
CREATE INDEX "CompraPedidoItem_materialId_idx" ON "CompraPedidoItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "EtiquetaIndustrial_codigo_key" ON "EtiquetaIndustrial"("codigo");

-- CreateIndex
CREATE INDEX "EtiquetaIndustrial_osId_idx" ON "EtiquetaIndustrial"("osId");

-- CreateIndex
CREATE INDEX "EtiquetaIndustrial_setorAtual_idx" ON "EtiquetaIndustrial"("setorAtual");

-- CreateIndex
CREATE UNIQUE INDEX "AssistenciaTecnicaChamado_numero_key" ON "AssistenciaTecnicaChamado"("numero");

-- CreateIndex
CREATE INDEX "AssistenciaTecnicaChamado_osId_idx" ON "AssistenciaTecnicaChamado"("osId");

-- CreateIndex
CREATE INDEX "AssistenciaTecnicaChamado_status_idx" ON "AssistenciaTecnicaChamado"("status");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoEstrutura" ADD CONSTRAINT "ProdutoEstrutura_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoEstrutura" ADD CONSTRAINT "ProdutoEstrutura_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoRoteiro" ADD CONSTRAINT "ProdutoRoteiro_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoRoteiro" ADD CONSTRAINT "ProdutoRoteiro_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngenhariaRevisao" ADD CONSTRAINT "EngenhariaRevisao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngenhariaRevisao" ADD CONSTRAINT "EngenhariaRevisao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacidadeSetor" ADD CONSTRAINT "CapacidadeSetor_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoProducao" ADD CONSTRAINT "PlanoProducao_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoProducao" ADD CONSTRAINT "PlanoProducao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoProducao" ADD CONSTRAINT "ApontamentoProducao_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoProducao" ADD CONSTRAINT "ApontamentoProducao_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApontamentoProducao" ADD CONSTRAINT "ApontamentoProducao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspecaoQualidade" ADD CONSTRAINT "InspecaoQualidade_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspecaoQualidade" ADD CONSTRAINT "InspecaoQualidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NaoConformidade" ADD CONSTRAINT "NaoConformidade_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NaoConformidade" ADD CONSTRAINT "NaoConformidade_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "InspecaoQualidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraPedido" ADD CONSTRAINT "CompraPedido_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraPedidoItem" ADD CONSTRAINT "CompraPedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "CompraPedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraPedidoItem" ADD CONSTRAINT "CompraPedidoItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtiquetaIndustrial" ADD CONSTRAINT "EtiquetaIndustrial_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtiquetaIndustrial" ADD CONSTRAINT "EtiquetaIndustrial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistenciaTecnicaChamado" ADD CONSTRAINT "AssistenciaTecnicaChamado_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistenciaTecnicaChamado" ADD CONSTRAINT "AssistenciaTecnicaChamado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

