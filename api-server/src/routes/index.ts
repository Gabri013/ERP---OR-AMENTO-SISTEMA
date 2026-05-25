import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientesRouter from "./clientes";
import produtosRouter from "./produtos";
import usuariosRouter from "./usuarios";
import orcamentosRouter from "./orcamentos";
import vendasRouter from "./vendas";
import osRouter from "./os";
import financeiroRouter from "./financeiro";
import dashboardRouter from "./dashboard";
import notificacoesRouter from "./notificacoes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clientesRouter);
router.use(produtosRouter);
router.use(usuariosRouter);
router.use(orcamentosRouter);
router.use(vendasRouter);
router.use(osRouter);
router.use(financeiroRouter);
router.use(dashboardRouter);
router.use(notificacoesRouter);

export default router;
