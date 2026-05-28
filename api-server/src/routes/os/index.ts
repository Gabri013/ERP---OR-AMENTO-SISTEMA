import { Router, type IRouter } from "express";
import { listRouter } from "./list";
import { getRouter } from "./get";
import { updateRouter } from "./update";
import { transitionsRouter } from "./transitions";
import { observationsRouter } from "./observations";
import { printRouter } from "./print";
import { kanbanRouter } from "./kanban";
import { pdfRouter } from "./pdf";

const router: IRouter = Router();

router.use(listRouter);
router.use(getRouter);
router.use(updateRouter);
router.use(transitionsRouter);
router.use(observationsRouter);
router.use(printRouter);
router.use(kanbanRouter);
router.use(pdfRouter);

export default router;
