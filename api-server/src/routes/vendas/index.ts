import { Router, type IRouter } from "express";
import { listRouter } from "./list";
import { createRouter } from "./create";
import { getRouter } from "./get";
import { updateRouter } from "./update";
import { gerarOsRouter } from "./gerar-os";

const router: IRouter = Router();

router.use(listRouter);
router.use(createRouter);
router.use(getRouter);
router.use(updateRouter);
router.use(gerarOsRouter);

export default router;
