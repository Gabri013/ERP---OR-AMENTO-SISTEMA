import { Router } from 'express';
import { TipoUsuario } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { checkPermission, checkRole } from '../middleware/checkPermission';
import { getDataFilter, canPerformAction } from '../utils/permissionFilters';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * EXEMPLO COMPLETO DE ROTA COM SISTEMA DE PERMISSÕES
 * 
 * Este arquivo demonstra como usar o sistema de permissões em uma rota real.
 * Todos os endpoints de orcamentos seguem este padrão.
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        tipo: TipoUsuario;
        setorId?: number;
      };
      permissionLevel?: string | boolean;
    }
  }
}

const router = Router();

/**
 * GET /api/orcamentos
 * 
 * Listar orçamentos com filtro automático de permissões
 * 
 * Permissões:
 * - master: vê TODOS os orçamentos
 * - gestor_vendas: vê TODOS os orçamentos
 * - vendedor: vê SÓ SEUS orçamentos
 * - financeiro: SEM acesso
 * 
 * Exemplo de uso:
 * GET /api/orcamentos
 * Authorization: Bearer {TOKEN}
 */
router.get(
  '/',
  authenticateToken,
  checkPermission('orcamentos', 'visualizar'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.tipo;
      const setorId = req.user!.setorId;

      logger.info({
        msg: 'Listando orçamentos',
        userId,
        userRole,
      });

      // Obter filtro automático baseado em permissões
      // getDataFilter retorna um where clause diferente para cada role
      const filter = getDataFilter(
        { userId, userRole, setorId },
        'orcamentos'
      );

      // Prisma executa a query com o filtro
      // Se master: sem filtro (vê tudo)
      // Se vendedor: filtra por usuarioId
      // Se financeiro: não chega aqui (checkPermission bloqueia)
      const orcamentos = await prisma.orcamento.findMany({
        where: filter,
        include: {
          cliente: {
            select: { id: true, nome: true, email: true, cnpj: true }
          },
          usuario: {
            select: { id: true, nome: true, email: true }
          },
          itens: {
            include: {
              produto: {
                select: { id: true, descricao: true, preco: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      logger.info({
        msg: 'Orçamentos listados com sucesso',
        count: orcamentos.length,
        userId,
      });

      res.json({
        success: true,
        data: orcamentos,
        count: orcamentos.length,
        permissionLevel: req.permissionLevel,
      });
    } catch (error) {
      logger.error({
        msg: 'Erro ao listar orçamentos',
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        error: 'Erro ao listar orçamentos',
      });
    }
  }
);

/**
 * GET /api/orcamentos/:id
 * 
 * Obter um orçamento específico
 * Mesmas permissões de visualizar
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermission('orcamentos', 'visualizar'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.tipo;
      const { id } = req.params;

      // Buscar o orçamento
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: parseInt(id) },
        include: {
          cliente: true,
          usuario: true,
          itens: { include: { produto: true } },
        },
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          error: 'Orçamento não encontrado',
        });
      }

      // Verificação granular: aplicar mesmo filtro
      const filter = getDataFilter(
        { userId, userRole, setorId: req.user!.setorId },
        'orcamentos'
      );

      // Se o filtro teria excluído este orçamento, negar acesso
      const shouldHaveAccess = 
        filter === {} ||
        (filter.usuarioId && filter.usuarioId === orcamento.usuarioId);

      if (!shouldHaveAccess && userRole !== 'master') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado a este orçamento',
        });
      }

      res.json({
        success: true,
        data: orcamento,
      });
    } catch (error) {
      logger.error('Erro ao buscar orçamento', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar orçamento',
      });
    }
  }
);

/**
 * POST /api/orcamentos
 * 
 * Criar novo orçamento
 * Permissões:
 * - master: permitido
 * - gestor_vendas: permitido
 * - vendedor: permitido
 * - outros: negado
 * 
 * Body esperado:
 * {
 *   "clienteId": 1,
 *   "dataOrcamento": "2025-05-26",
 *   "desconto": 0,
 *   "observacoes": "...",
 *   "itens": [
 *     {
 *       "produtoId": 1,
 *       "quantidade": 10,
 *       "valorUnitario": 100,
 *       "valorTotal": 1000
 *     }
 *   ]
 * }
 */
router.post(
  '/',
  authenticateToken,
  checkPermission('orcamentos', 'criar'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { clienteId, dataOrcamento, itens, desconto = 0, observacoes } = req.body;

      // Validações
      if (!clienteId || !itens || itens.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'clienteId e itens são obrigatórios',
        });
      }

      // Verificar se cliente existe
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
      });

      if (!cliente) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado',
        });
      }

      // Calcular valor total
      const valorTotal = itens.reduce(
        (sum: number, item: any) => sum + Number(item.valorTotal),
        0
      );

      // Gerar número do orçamento
      const numeroOrcamento = `ORC-${Date.now()}`;

      // Criar orçamento com itens
      const orcamento = await prisma.orcamento.create({
        data: {
          numero: numeroOrcamento,
          clienteId,
          usuarioId: userId,
          dataOrcamento: new Date(dataOrcamento),
          validade: new Date(
            new Date(dataOrcamento).getTime() + 30 * 24 * 60 * 60 * 1000
          ),
          valorTotal,
          desconto,
          status: 'pendente',
          observacoes,
          itens: {
            create: itens.map((item: any) => ({
              produtoId: item.produtoId,
              descricaoManual: item.descricaoManual,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              valorTotal: item.valorTotal,
            })),
          },
        },
        include: {
          cliente: true,
          usuario: true,
          itens: { include: { produto: true } },
        },
      });

      logger.info({
        msg: 'Orçamento criado com sucesso',
        numeroOrcamento: orcamento.numero,
        clienteId,
        userId,
        valorTotal,
      });

      res.status(201).json({
        success: true,
        message: 'Orçamento criado com sucesso',
        data: orcamento,
      });
    } catch (error) {
      logger.error('Erro ao criar orçamento', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar orçamento',
      });
    }
  }
);

/**
 * PATCH /api/orcamentos/:id
 * 
 * Editar orçamento existente
 * 
 * Permissões:
 * - master: pode editar qualquer um
 * - gestor_vendas: pode editar qualquer um
 * - vendedor: SÓ SEU PRÓPRIO (own_created)
 * - outros: negado
 * 
 * Exemplo:
 * PATCH /api/orcamentos/123
 * Body: { "desconto": 50, "observacoes": "Desconto aprovado" }
 */
router.patch(
  '/:id',
  authenticateToken,
  checkPermission('orcamentos', 'editar'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.tipo;
      const setorId = req.user!.setorId;
      const { id } = req.params;
      const updates = req.body;

      // Buscar orçamento
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: parseInt(id) },
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          error: 'Orçamento não encontrado',
        });
      }

      // Verificação granular: pode editar este orçamento?
      const canEdit = canPerformAction(
        { userId, userRole, setorId },
        'editar',
        'orcamento',
        { usuarioId: orcamento.usuarioId }
      );

      if (!canEdit) {
        logger.warn({
          msg: 'Tentativa de editar orçamento sem permissão',
          userId,
          userRole,
          orcamentoId: id,
          orcamentoOwner: orcamento.usuarioId,
        });

        return res.status(403).json({
          success: false,
          error: 'Você não pode editar este orçamento',
          details: 'Apenas o criador do orçamento pode editá-lo',
        });
      }

      // Atualizar orçamento
      const updated = await prisma.orcamento.update({
        where: { id: parseInt(id) },
        data: updates,
        include: {
          cliente: true,
          usuario: true,
          itens: { include: { produto: true } },
        },
      });

      logger.info({
        msg: 'Orçamento atualizado',
        orcamentoId: id,
        userId,
        changes: Object.keys(updates),
      });

      res.json({
        success: true,
        message: 'Orçamento atualizado com sucesso',
        data: updated,
      });
    } catch (error) {
      logger.error('Erro ao atualizar orçamento', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar orçamento',
      });
    }
  }
);

/**
 * DELETE /api/orcamentos/:id
 * 
 * Deletar orçamento
 * 
 * Permissões:
 * - master: pode deletar qualquer um
 * - gestor_vendas: pode deletar qualquer um
 * - vendedor: negado (false)
 * - outros: negado
 */
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('orcamentos', 'deletar'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Buscar orçamento
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: parseInt(id) },
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          error: 'Orçamento não encontrado',
        });
      }

      // Deletar orçamento
      // Nota: Se houver relacionamentos, Prisma pode gerar erro
      await prisma.orcamento.delete({
        where: { id: parseInt(id) },
      });

      logger.info({
        msg: 'Orçamento deletado',
        orcamentoId: id,
        userId,
      });

      res.json({
        success: true,
        message: 'Orçamento deletado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao deletar orçamento', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar orçamento',
      });
    }
  }
);

/**
 * POST /api/orcamentos/:id/converter
 * 
 * Converter orçamento para venda
 * Ação específica com sua própria permissão
 * 
 * Permissões:
 * - master: permitido
 * - gestor_vendas: permitido
 * - vendedor: negado (false)
 * - outros: negado
 * 
 * Exemplo:
 * POST /api/orcamentos/123/converter
 */
router.post(
  '/:id/converter',
  authenticateToken,
  checkPermission('orcamentos', 'converter'),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Buscar orçamento com todos os dados
      const orcamento = await prisma.orcamento.findUnique({
        where: { id: parseInt(id) },
        include: {
          itens: true,
          cliente: true,
        },
      });

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          error: 'Orçamento não encontrado',
        });
      }

      // Verificar se já foi convertido
      if (orcamento.status === 'convertido') {
        return res.status(400).json({
          success: false,
          error: 'Este orçamento já foi convertido em venda',
        });
      }

      // Criar venda
      const numeroVenda = `VND-${Date.now()}`;

      const venda = await prisma.venda.create({
        data: {
          numero: numeroVenda,
          orcamentoId: parseInt(id),
          clienteId: orcamento.clienteId,
          usuarioId: userId,
          dataVenda: new Date(),
          valorTotal: orcamento.valorTotal,
          desconto: orcamento.desconto,
          status: 'em_andamento',
        },
        include: {
          cliente: true,
          orcamento: true,
          usuario: true,
        },
      });

      // Atualizar status do orçamento
      await prisma.orcamento.update({
        where: { id: parseInt(id) },
        data: { status: 'convertido' },
      });

      logger.info({
        msg: 'Orçamento convertido em venda',
        numeroOrcamento: orcamento.numero,
        numeroVenda: venda.numero,
        clienteId: orcamento.clienteId,
        userId,
      });

      res.status(201).json({
        success: true,
        message: `Orçamento #${orcamento.numero} convertido em venda #${numeroVenda}`,
        data: {
          venda,
          orcamento: {
            ...orcamento,
            status: 'convertido',
          },
        },
      });
    } catch (error) {
      logger.error('Erro ao converter orçamento', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao converter orçamento',
      });
    }
  }
);

/**
 * GET /api/permissions/orcamentos
 * 
 * Endpoint para frontend obter permissões do usuário
 * Útil para mostrar/esconder botões
 * 
 * Exemplo de uso no React:
 * 
 * const [permissions, setPermissions] = useState({});
 * useEffect(() => {
 *   fetch('/api/permissions/orcamentos')
 *     .then(r => r.json())
 *     .then(d => setPermissions(d.permissions));
 * }, []);
 * 
 * return (
 *   <div>
 *     {permissions.criar && <button>Criar Orçamento</button>}
 *     {permissions.editar && <button>Editar</button>}
 *   </div>
 * );
 */
router.get(
  '/permissions',
  authenticateToken,
  (req, res) => {
    try {
      const userRole = req.user!.tipo;
      const { getModulePermissions } = require('../utils/permissionFilters');

      const permissions = getModulePermissions(userRole, 'orcamentos');

      res.json({
        success: true,
        module: 'orcamentos',
        role: userRole,
        permissions,
      });
    } catch (error) {
      logger.error('Erro ao obter permissões', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao obter permissões',
      });
    }
  }
);

export default router;
