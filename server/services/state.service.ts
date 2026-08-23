import { EventEmitter } from "events";
import { AppSettings, initialConfig } from "../config";

export interface PipelineExecutionLog {
  id: string;
  timestamp: string;
  triggerType: "scheduled" | "manual";
  status: "running" | "success" | "error";
  durationMs?: number;
  sourcesProcessed?: number;
  totalArticlesFetched?: number;
  aiSummary?: string;
  emailSentTo?: string;
  emailDeliveryMethod?: "gmail_api" | "simulated";
  gmailMessageId?: string;
  error?: string;
  logs: Array<{
    timestamp: string;
    step: "fetch" | "ai" | "email" | "system";
    level: "info" | "warn" | "error";
    message: string;
  }>;
}

class StateService extends EventEmitter {
  private settings: AppSettings = { ...initialConfig };
  private currentExecution: PipelineExecutionLog | null = null;
  private history: PipelineExecutionLog[] = [];

  constructor() {
    super();
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getPublicSettings() {
    return {
      searchUrls: this.settings.searchUrls,
      apiKey: this.settings.apiKey ? "••••••••" + this.settings.apiKey.slice(-4) : "",
      hasApiKey: Boolean(this.settings.apiKey && this.settings.apiKey.length > 5),
      promptInstructions: this.settings.promptInstructions,
      scheduledTime: this.settings.scheduledTime,
      googleConnected: Boolean(
        this.settings.googleConnected ||
          (this.settings.googleOAuth.refreshToken && this.settings.googleOAuth.userEmail)
      ),
      googleUserEmail: this.settings.googleOAuth.userEmail || "",
      hasGoogleRefreshToken: Boolean(this.settings.googleOAuth.refreshToken),
      googleOAuth: {
        clientId: this.settings.googleOAuth.clientId
          ? this.settings.googleOAuth.clientId.slice(0, 10) + "..."
          : "",
        redirectUri: this.settings.googleOAuth.redirectUri,
        userEmail: this.settings.googleOAuth.userEmail,
      },
      geminiModel: this.settings.geminiModel,
    };
  }

  updateSettings(updates: Partial<AppSettings>): AppSettings {
    const prevTime = this.settings.scheduledTime;

    // Only overwrite apiKey if a non-masked new value is provided
    if (updates.apiKey && updates.apiKey.includes("••••")) {
      delete updates.apiKey;
    }

    this.settings = {
      ...this.settings,
      ...updates,
      googleOAuth: {
        ...this.settings.googleOAuth,
        ...(updates.googleOAuth || {}),
      },
    };

    if (updates.scheduledTime && updates.scheduledTime !== prevTime) {
      this.emit("scheduleChanged", this.settings.scheduledTime);
    }

    this.emit("settingsChanged", this.settings);
    return this.getSettings();
  }

  setGoogleTokens(refreshToken: string, userEmail: string) {
    this.settings.googleOAuth.refreshToken = refreshToken;
    this.settings.googleOAuth.userEmail = userEmail;
    this.settings.googleConnected = true;
    this.emit("settingsChanged", this.settings);
  }

  clearGoogleTokens() {
    this.settings.googleOAuth.refreshToken = "";
    this.settings.googleOAuth.userEmail = "";
    this.settings.googleConnected = false;
    this.emit("settingsChanged", this.settings);
  }

  startExecution(triggerType: "scheduled" | "manual"): PipelineExecutionLog {
    const execution: PipelineExecutionLog = {
      id: "run_" + Date.now(),
      timestamp: new Date().toISOString(),
      triggerType,
      status: "running",
      logs: [
        {
          timestamp: new Date().toISOString(),
          step: "system",
          level: "info",
          message: `Pipeline initiated via ${triggerType} trigger.`,
        },
      ],
    };

    this.currentExecution = execution;
    this.emit("executionStarted", execution);
    return execution;
  }

  appendLog(
    step: "fetch" | "ai" | "email" | "system",
    level: "info" | "warn" | "error",
    message: string
  ) {
    if (this.currentExecution) {
      this.currentExecution.logs.push({
        timestamp: new Date().toISOString(),
        step,
        level,
        message,
      });
      this.emit("executionLog", { step, level, message });
    }
  }

  completeExecution(
    updates: Partial<PipelineExecutionLog> & { status: "success" | "error" }
  ): PipelineExecutionLog {
    if (!this.currentExecution) {
      return {} as PipelineExecutionLog;
    }

    this.currentExecution = {
      ...this.currentExecution,
      ...updates,
    };

    this.history.unshift(this.currentExecution);
    if (this.history.length > 20) {
      this.history.pop();
    }

    const completed = this.currentExecution;
    this.currentExecution = null;
    this.emit("executionCompleted", completed);
    return completed;
  }

  getCurrentExecution(): PipelineExecutionLog | null {
    return this.currentExecution;
  }

  getLastExecution(): PipelineExecutionLog | null {
    return this.history[0] || null;
  }

  getHistory(): PipelineExecutionLog[] {
    return [...this.history];
  }
}

export const stateService = new StateService();
