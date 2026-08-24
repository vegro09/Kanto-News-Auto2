import fs from "fs";
import path from "path";

export interface StoredSummary {
  id: string;
  timestamp: string;
  title: string;
  summaryArabic: string;
  triggerType: "scheduled" | "manual";
  durationMs: number;
  sourcesProcessed: number;
  totalArticlesFetched: number;
  sources: Array<{
    title: string;
    hostname: string;
    articlesCount: number;
    url: string;
  }>;
  promptInstructions: string;
  model: string;
  isMock?: boolean;
}

class StorageService {
  private dataDir: string;
  private filePath: string;
  private memoryCache: StoredSummary[] = [];

  constructor() {
    this.dataDir = path.resolve(process.cwd(), "data");
    this.filePath = path.resolve(this.dataDir, "summaries.json");
    this.initStorage();
  }

  private initStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.memoryCache = JSON.parse(raw);
      } else {
        // Initialize with default template / empty array
        this.memoryCache = [];
        this.persist();
      }
    } catch (err: any) {
      console.warn("[Storage] Failed to read summaries.json, starting with empty memory cache:", err.message);
      this.memoryCache = [];
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryCache, null, 2), "utf-8");
    } catch (err: any) {
      console.error("[Storage] Failed to persist summaries to disk:", err.message);
    }
  }

  saveSummary(summary: Omit<StoredSummary, "id" | "timestamp"> & { id?: string; timestamp?: string }): StoredSummary {
    const newSummary: StoredSummary = {
      id: summary.id || "summary_" + Date.now(),
      timestamp: summary.timestamp || new Date().toISOString(),
      ...summary,
    };

    // Prepend to list (newest first)
    this.memoryCache.unshift(newSummary);

    // Limit to last 50 digests locally
    if (this.memoryCache.length > 50) {
      this.memoryCache = this.memoryCache.slice(0, 50);
    }

    this.persist();
    console.log(`[Storage] Saved summary digest #${newSummary.id} (${newSummary.totalArticlesFetched} items) to local archive.`);
    return newSummary;
  }

  getAllSummaries(): StoredSummary[] {
    return [...this.memoryCache];
  }

  getSummaryById(id: string): StoredSummary | null {
    return this.memoryCache.find((s) => s.id === id) || null;
  }

  deleteSummary(id: string): boolean {
    const initialLen = this.memoryCache.length;
    this.memoryCache = this.memoryCache.filter((s) => s.id !== id);
    if (this.memoryCache.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  getTotalCount(): number {
    return this.memoryCache.length;
  }
}

export const storageService = new StorageService();
