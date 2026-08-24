import { Router, Request, Response } from "express";
import { stateService } from "../services/state.service";
import { schedulerService } from "../services/scheduler.service";
import { pipelineService } from "../services/pipeline.service";
import { storageService } from "../services/storage.service";

const router = Router();

// GET /api/health
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    mode: "Local Intelligence Dashboard",
    timestamp: new Date().toISOString(),
  });
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

// POST /api/trigger-test (Runs the complete local intelligence pipeline)
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

// GET /api/summaries (Returns all archived digests)
router.get("/summaries", (_req: Request, res: Response) => {
  try {
    const summaries = storageService.getAllSummaries();
    res.json({
      success: true,
      count: summaries.length,
      summaries,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/summaries/:id
router.get("/summaries/:id", (req: Request, res: Response) => {
  try {
    const summary = storageService.getSummaryById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, error: "Summary not found" });
    }
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/summaries/:id
router.delete("/summaries/:id", (req: Request, res: Response) => {
  try {
    const deleted = storageService.deleteSummary(req.params.id);
    res.json({
      success: deleted,
      message: deleted ? "Summary removed from archive." : "Summary not found.",
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
    const totalArchived = storageService.getTotalCount();

    res.json({
      success: true,
      scheduler: schedulerStatus,
      totalArchived,
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
