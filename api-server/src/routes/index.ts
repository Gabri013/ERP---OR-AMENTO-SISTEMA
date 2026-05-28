import { Router, type IRouter } from "express";
import authRouter from "./auth";
import clientesRouter from "./clientes";
import produtosRouter from "./produtos";
import usuariosRouter from "./usuarios";
import orcamentosRouter from "./orcamentos/index";
import vendasRouter from "./vendas/index";
import osRouter from "./os/index";
import jobsRouter from "./jobs";
import financeiroRouter from "./financeiro";
import dashboardRouter from "./dashboard";
import notificacoesRouter from "./notificacoes";
import checklistRouter from "./checklist";
import anexosRouter from "./anexos";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(authRouter);
router.use(clientesRouter);
router.use(produtosRouter);
router.use(usuariosRouter);
router.use(orcamentosRouter);
router.use(vendasRouter);
router.use(osRouter);
router.use(jobsRouter);
router.use(financeiroRouter);
router.use(dashboardRouter);
router.use(notificacoesRouter);
router.use(checklistRouter);
router.use(anexosRouter);
router.use(exportRouter);

export default router;
