import cron, { ScheduledTask } from "node-cron";
import { stateService } from "./state.service";
import { pipelineService } from "./pipeline.service";

export class SchedulerService {
  private currentTask: ScheduledTask | null = null;
  private currentCronExpression: string | null = null;
  private scheduledTime: string = "07:00";

  constructor() {
    stateService.on("scheduleChanged", (newTime: string) => {
      this.setSchedule(newTime);
    });
  }

  /**
   * Convert HH:mm format (e.g. "07:00" or "18:30") to standard 5-part cron: "30 18 * * *"
   */
  private timeToCron(timeStr: string): string | null {
    if (!timeStr || typeof timeStr !== "string") return null;

    // Handles "07:00" or "7:00"
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return `${minute} ${hour} * * *`;
  }

  setSchedule(timeStr: string): boolean {
    const cronExp = this.timeToCron(timeStr);
    if (!cronExp) {
      console.warn(`[Scheduler] Invalid time format "${timeStr}". Must be HH:mm (e.g., 07:00).`);
      return false;
    }

    if (this.currentTask) {
      this.currentTask.stop();
      console.log(`[Scheduler] Stopped previous cron task.`);
    }

    this.scheduledTime = timeStr;
    this.currentCronExpression = cronExp;

    console.log(`[Scheduler] Initializing cron job for "${timeStr}" (cron: "${cronExp}")...`);

    this.currentTask = cron.schedule(cronExp, async () => {
      console.log(`[Scheduler] ⏰ Cron trigger fired at scheduled time ${this.scheduledTime}!`);
      try {
        await pipelineService.executePipeline("scheduled");
      } catch (err: any) {
        console.error(`[Scheduler] Scheduled pipeline execution failed:`, err);
      }
    });

    console.log(`[Scheduler] Cron task active for daily execution at ${timeStr}.`);
    return true;
  }

  getStatus() {
    return {
      scheduledTime: this.scheduledTime,
      cronExpression: this.currentCronExpression,
      isRunning: Boolean(this.currentTask),
      isPipelineBusy: pipelineService.isBusy(),
    };
  }
}

export const schedulerService = new SchedulerService();
