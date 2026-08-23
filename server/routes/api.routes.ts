import { Router, Request, Response } from "express";
import { stateService } from "../services/state.service";
import { schedulerService } from "../services/scheduler.service";
import { pipelineService } from "../services/pipeline.service";

const router = Router();

// GET /api/health
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/settings
router.get("/settings", (_req: Request, res: Response) => {
  try {
    const settings = stateService.getPublicSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/settings
router.post("/settings", (req: Request, res: Response) => {
  try {
    const updates = req.body;
    stateService.updateSettings(updates);
    const updated = stateService.getPublicSettings();
    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/trigger-test
router.post("/trigger-test", async (_req: Request, res: Response) => {
  try {
    if (pipelineService.isBusy()) {
      return res.status(429).json({
        success: false,
        error: "A pipeline execution is currently in progress.",
      });
    }

    const result = await pipelineService.executePipeline("manual");
    res.json({
      success: result.status === "success",
      result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/status
router.get("/status", (_req: Request, res: Response) => {
  try {
    const schedulerStatus = schedulerService.getStatus();
    const currentExecution = stateService.getCurrentExecution();
    const lastExecution = stateService.getLastExecution();

    res.json({
      success: true,
      scheduler: schedulerStatus,
      currentExecution,
      lastExecution,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/history
router.get("/history", (_req: Request, res: Response) => {
  try {
    const history = stateService.getHistory();
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
