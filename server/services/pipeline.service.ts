import { stateService, PipelineExecutionLog } from "./state.service";
import { fetcherService } from "./fetcher.service";
import { aiService } from "./ai.service";
import { mailerService } from "./mailer.service";

export class PipelineService {
  private isRunning = false;

  async executePipeline(
    triggerType: "scheduled" | "manual" = "manual"
  ): Promise<PipelineExecutionLog> {
    if (this.isRunning) {
      throw new Error("A pipeline execution is already in progress.");
    }

    this.isRunning = true;
    const startTime = Date.now();
    const settings = stateService.getSettings();
    stateService.startExecution(triggerType);

    try {
      // Step 1: Data Fetching Engine
      stateService.appendLog(
        "system",
        "info",
        `[Phase 1/3] Fetching data from ${settings.searchUrls.length} configured URL sources...`
      );
      const sources = await fetcherService.fetchAllSources(settings.searchUrls);
      const totalArticles = sources.reduce((acc, s) => acc + s.articles.length, 0);

      // Step 2: AI Summarization with Gemini
      stateService.appendLog(
        "system",
        "info",
        `[Phase 2/3] Processing ${totalArticles} items with Gemini AI Engine...`
      );
      const aiResult = await aiService.generateArabicSummary(
        sources,
        settings.promptInstructions,
        settings.apiKey
      );

      // Step 3: Email Delivery
      stateService.appendLog(
        "system",
        "info",
        `[Phase 3/3] Delivering summary digest to ${settings.recipientEmail}...`
      );
      const emailResult = await mailerService.sendSummaryEmail(
        aiResult.summaryArabic,
        settings.recipientEmail
      );

      const durationMs = Date.now() - startTime;
      stateService.appendLog(
        "system",
        "info",
        `Pipeline execution successfully completed in ${(durationMs / 1000).toFixed(2)}s.`
      );

      const completed = stateService.completeExecution({
        status: "success",
        durationMs,
        sourcesProcessed: sources.length,
        totalArticlesFetched: totalArticles,
        aiSummary: aiResult.summaryArabic,
        emailSentTo: emailResult.recipient,
        emailPreviewUrl: emailResult.previewUrl,
      });

      return completed;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      stateService.appendLog(
        "system",
        "error",
        `Pipeline execution failed: ${err?.message || "Unknown error"}`
      );

      const failed = stateService.completeExecution({
        status: "error",
        durationMs,
        error: err?.message || "Execution encountered an error",
      });

      return failed;
    } finally {
      this.isRunning = false;
    }
  }

  isBusy(): boolean {
    return this.isRunning;
  }
}

export const pipelineService = new PipelineService();
