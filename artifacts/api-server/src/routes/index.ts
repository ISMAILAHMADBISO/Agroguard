/**
 * AgroGuard API Routes — main router barrel.
 * All domain routers are mounted here and re-exported to app.ts.
 */
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import farmersRouter from "./farmers";
import devicesRouter from "./devices";
import readingsRouter from "./readings";
import alertsRouter from "./alerts";
import recommendationsRouter from "./recommendations";
import thresholdsRouter from "./thresholds";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import staffRouter from "./staff";
import achievementsRouter from "./achievements";
import paymentsRouter from "./payments";
import ordersRouter from "./orders";
import deploymentsRouter from "./deployments";
import inventoryRouter from "./inventory";
import maintenanceRouter from "./maintenance";
import { systemRouter } from "./system-logs";
import { weatherRouter } from "./weather";
import { analyticsRouter } from "./analytics";
import { knowledgeRouter } from "./knowledge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(farmersRouter);
router.use(devicesRouter);
router.use(readingsRouter);
router.use(alertsRouter);
router.use(recommendationsRouter);
router.use(staffRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(achievementsRouter);
router.use(paymentsRouter);
router.use(ordersRouter);
router.use(deploymentsRouter);
router.use(inventoryRouter);
router.use(maintenanceRouter);
router.use("/system-logs", systemRouter);
router.use("/weather", weatherRouter);
router.use("/analytics", analyticsRouter);
router.use("/knowledge", knowledgeRouter);

export default router;
