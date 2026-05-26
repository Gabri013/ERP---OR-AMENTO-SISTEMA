import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth, requireRoles, ALL_ROLES, PRODUCTION_ROLES } from "../middleware/auth";
import { response } from "../utils/response";

const router: IRouter = Router();

// Checklists padrão por etapa
const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  programacao:  ["Pedido recebido e conferido", "Desenhos técnicos disponíveis", "Material listado"],
  engenharia:   ["Projeto técnico aprovado", "Tolerâncias definidas", "Revisão de engenharia concluída"],
  corte:        ["Medidas conferidas", "Material cortado conforme projeto", "Rebarbas removidas"],
  dobra:        ["Ângulos verificados", "Dimensões conferidas após dobra"],
  tubo:         ["Tubulação cortada", "Curvas verificadas", "Conexões testadas"],
  solda:        ["Acabamento da solda OK", "Solda revisada visualmente", "Medidas conferidas pós-solda"],
  coccao:       ["Equipamento de cocção instalado", "Teste de temperatura", "Vedação verificada"],
  refrigeracao: ["Teste de pressão OK", "Gás aplicado conforme especificação", "Temperatura validada", "Vazamentos verificados"],
  mobiliario:   ["Estrutura montada", "Acabamento superficial OK", "Fixações verificadas"],
  montagem:     ["Todos componentes montados", "Teste funcional", "Limpeza final"],
  revisao:      ["Revisão dimensional", "Revisão visual geral", "Conformidade com projeto"],
  embalagem:    ["Produto limpo e protegido", "Etiqueta aplicada", "Nota fiscal conferida"],
  expedicao:    ["Volumes conferidos", "Documentação completa", "Transportadora notificada"],
};

// GET /os/:id/checklist
router.get("/os/:id/checklist", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const osId = Number(req.params.id);
  const nm = (db as any).oSChecklist;

  let items = await nm.findMany({ where: { osId }, orderBy: { id: "asc" } });

  // Se não há checklists, inicializa com os padrões
  if (items.length === 0) {
    const os = await db.ordemServico.findUnique({ where: { id: osId } });
    if (os) {
      const etapa = os.etapaAtual as string;
      const defaults = DEFAULT_CHECKLISTS[etapa] ?? [];
      if (defaults.length > 0) {
        await nm.createMany({
          data: defaults.map((item: string) => ({
            osId, etapa, item, concluido: false, obrigatorio: false,
          })),
        });
        items = await nm.findMany({ where: { osId }, orderBy: { id: "asc" } });
      }
    }
  }

  res.json(response.success(items));
});

// POST /os/:id/checklist - adiciona item
router.post("/os/:id/checklist", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const osId = Number(req.params.id);
  const { etapa, item, obrigatorio } = req.body;
  if (!etapa || !item) {
    res.status(400).json(response.error("etapa e item são obrigatórios", "VALIDATION_ERROR"));
    return;
  }
  const nm = (db as any).oSChecklist;
  const created = await nm.create({
    data: { osId, etapa, item, obrigatorio: obrigatorio ?? false },
  });
  res.status(201).json(response.success(created));
});

// PATCH /os/:id/checklist/:checkId - marca como concluído ou não
router.patch("/os/:id/checklist/:checkId", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const checkId = Number(req.params.checkId);
  const userId = (req as any).currentUser?.id;
  const { concluido } = req.body;
  const nm = (db as any).oSChecklist;
  const updated = await nm.update({
    where: { id: checkId },
    data: {
      concluido: !!concluido,
      concluidoEm: concluido ? new Date() : null,
      usuarioId: concluido ? userId : null,
    },
  });
  res.json(response.success(updated));
});

// POST /os/:id/checklist/inicializar - cria checklists padrão para etapa atual
router.post("/os/:id/checklist/inicializar", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const osId = Number(req.params.id);
  const { etapa } = req.body;
  const nm = (db as any).oSChecklist;
  const defaults = DEFAULT_CHECKLISTS[etapa ?? ""] ?? [];

  if (defaults.length > 0) {
    await nm.createMany({
      data: defaults.map((item: string) => ({
        osId, etapa, item, concluido: false, obrigatorio: false,
      })),
      skipDuplicates: true,
    });
  }

  const items = await nm.findMany({ where: { osId, etapa }, orderBy: { id: "asc" } });
  res.json(response.success(items));
});

export default router;
