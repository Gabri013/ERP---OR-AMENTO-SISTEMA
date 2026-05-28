import { Router, type IRouter } from "express";
import { listRouter } from "./list";
import { createRouter } from "./create";
import { getRouter } from "./get";
import { updateRouter } from "./update";
import { deleteRouter } from "./delete";
import { conversionsRouter } from "./conversions";
import { pdfRouter } from "./pdf";

const router: IRouter = Router();

router.use(listRouter);
router.use(createRouter);
router.use(getRouter);
router.use(updateRouter);
router.use(deleteRouter);
router.use(conversionsRouter);
router.use(pdfRouter);

export default router;
