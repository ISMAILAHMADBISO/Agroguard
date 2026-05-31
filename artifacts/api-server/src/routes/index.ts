/**
 * AgroGuard API Routes — main router barrel.
 * All domain routers are mounted here and re-exported to app.ts.
 */
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmersRouter from "./farmers";
import devicesRouter from "./devices";
import readingsRouter from "./readings";
import alertsRouter from "./alerts";
import recommendationsRouter from "./recommendations";
import staffRouter from "./staff";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(devicesRouter);
router.use(readingsRouter);
router.use(alertsRouter);
router.use(recommendationsRouter);
router.use(staffRouter);
router.use(dashboardRouter);

export default router;
