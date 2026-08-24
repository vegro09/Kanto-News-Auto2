import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type View = "dashboard" | "settings";
export type ExecutionStep = "idle" | "fetch" | "ai" | "storage" | "done" | "error";

const STORAGE_KEY = "kanto-flow-state-v4";

export interface StoredSummaryItem {
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

export interface ExecutionLogItem {
  timestamp: string;
  step: "fetch" | "ai" | "storage" | "system";
  level: "info" | "warn" | "error";
  message: string;
}

export interface PipelineExecutionResult {
  id?: string;
  timestamp?: string;
  triggerType?: "scheduled" | "manual";
  status: "running" | "success" | "error";
  durationMs?: number;
  sourcesProcessed?: number;
  totalArticlesFetched?: number;
  aiSummary?: string;
  summaryId?: string;
  error?: string;
  logs?: ExecutionLogItem[];
}

export interface PersistedState {
  searchUrls: string[];
  apiKey: string;
  hasApiKey: boolean;
  promptInstructions: string;
  scheduledTime: string;
}

interface FlowContextValue extends PersistedState {
  view: View;
  toggleView: () => void;
  setApiKey: (value: string) => void;
  setPromptInstructions: (value: string) => void;
  setScheduledTime: (value: string) => void;
  addSearchUrl: () => void;
  updateSearchUrl: (index: number, url: string) => void;
  removeSearchUrl: (index: number) => void;
  isSyncing: boolean;
  isExecuting: boolean;
  activeStep: ExecutionStep;
  lastExecution: PipelineExecutionResult | null;
  summaries: StoredSummaryItem[];
  selectedSummary: StoredSummaryItem | null;
  selectSummary: (id: string | null) => void;
  deleteSummary: (id: string) => Promise<void>;
  fetchSummaries: () => Promise<void>;
  saveSettingsToBackend: (customUpdates?: Partial<PersistedState>) => Promise<boolean>;
  triggerTestRun: () => Promise<PipelineExecutionResult | null>;
  fetchStatus: () => Promise<void>;
}

const DEFAULTS: PersistedState = {
  searchUrls: [
    "https://news.ycombinator.com/rss",
    "https://www.theverge.com/rss/index.xml",
  ],
  apiKey: "",
  hasApiKey: false,
  promptInstructions:
    "Synthesize the gathered material into a bilingual intelligence brief (Part 1: Arabic, Part 2: English). Strictly avoid any emojis. Intelligently identify and flag high-priority developments in UI/UX prototyping, automated vibe coding environments, independent filmmaking, scriptwriting tools, and foundation AI models, providing their direct source links.",
  scheduledTime: "07:00",
};

const API_BASE = "";

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [view, setView] = useState<View>("dashboard");
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState<ExecutionStep>("idle");
  const [lastExecution, setLastExecution] = useState<PipelineExecutionResult | null>(null);
  const [summaries, setSummaries] = useState<StoredSummaryItem[]>([]);
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);

  // Hydrate from localStorage first
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<PersistedState>) });
      }
    } catch {
      // Fall back to defaults
    }
    setHydrated(true);
  }, []);

  const fetchSummaries = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/summaries`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.summaries)) {
          setSummaries(data.summaries);
          if (!selectedSummaryId && data.summaries.length > 0) {
            setSelectedSummaryId(data.summaries[0].id);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch summaries list:", err);
    }
  }, [selectedSummaryId]);

  // Fetch live settings and summaries from Express backend on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const res = await fetch(`${API_BASE}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setState((prev) => ({
              ...prev,
              searchUrls: data.settings.searchUrls || prev.searchUrls,
              hasApiKey: data.settings.hasApiKey ?? false,
              promptInstructions: data.settings.promptInstructions || prev.promptInstructions,
              scheduledTime: data.settings.scheduledTime || prev.scheduledTime,
            }));
          }
        }

        await fetchSummaries();

        const statusRes = await fetch(`${API_BASE}/api/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.lastExecution) {
            setLastExecution(statusData.lastExecution);
          }
        }
      } catch {
        // Backend not yet reachable or dev mode
      }
    }

    loadBackendData();
  }, [fetchSummaries]);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const patch = useCallback(
    (partial: Partial<PersistedState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    []
  );

  const addSearchUrl = useCallback(
    () => setState((prev) => ({ ...prev, searchUrls: [...prev.searchUrls, ""] })),
    []
  );

  const updateSearchUrl = useCallback((index: number, url: string) => {
    setState((prev) => ({
      ...prev,
      searchUrls: prev.searchUrls.map((u, i) => (i === index ? url : u)),
    }));
  }, []);

  const removeSearchUrl = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      searchUrls: prev.searchUrls.filter((_, i) => i !== index),
    }));
  }, []);

  const selectSummary = useCallback((id: string | null) => {
    setSelectedSummaryId(id);
  }, []);

  const deleteSummary = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/summaries/${id}`, { method: "DELETE" });
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      if (selectedSummaryId === id) {
        setSelectedSummaryId((prev) => {
          const remaining = summaries.filter((s) => s.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    } catch (err) {
      console.error("Failed to delete summary:", err);
    }
  }, [selectedSummaryId, summaries]);

  // Synchronize state with Express backend
  const saveSettingsToBackend = useCallback(
    async (customUpdates?: Partial<PersistedState>): Promise<boolean> => {
      setIsSyncing(true);
      try {
        const payload = {
          ...state,
          ...(customUpdates || {}),
        };
        const res = await fetch(`${API_BASE}/api/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setState((prev) => ({
              ...prev,
              hasApiKey: data.settings.hasApiKey ?? prev.hasApiKey,
            }));
          }
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to sync settings with backend:", err);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [state]
  );

  // Trigger manual test run of the complete pipeline
  const triggerTestRun = useCallback(async (): Promise<PipelineExecutionResult | null> => {
    if (isExecuting) return null;

    setIsExecuting(true);
    setActiveStep("fetch");

    const fetchTimer = setTimeout(() => setActiveStep("ai"), 900);
    const aiTimer = setTimeout(() => setActiveStep("storage"), 2200);

    try {
      await saveSettingsToBackend();

      const res = await fetch(`${API_BASE}/api/trigger-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      clearTimeout(fetchTimer);
      clearTimeout(aiTimer);

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setLastExecution(data.result);
          setActiveStep(data.result.status === "success" ? "done" : "error");
          await fetchSummaries();
          if (data.result.summaryId) {
            setSelectedSummaryId(data.result.summaryId);
          }
          return data.result;
        }
      }

      setActiveStep("error");
      return null;
    } catch (err: any) {
      clearTimeout(fetchTimer);
      clearTimeout(aiTimer);
      setActiveStep("error");
      console.error("Pipeline test trigger failed:", err);
      return null;
    } finally {
      setIsExecuting(false);
      setTimeout(() => {
        setActiveStep("idle");
      }, 4000);
    }
  }, [isExecuting, saveSettingsToBackend, fetchSummaries]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.lastExecution) {
          setLastExecution(data.lastExecution);
        }
      }
    } catch {
      // Ignore poll errors
    }
  }, []);

  const selectedSummary = useMemo(() => {
    if (!selectedSummaryId) return summaries[0] || null;
    return summaries.find((s) => s.id === selectedSummaryId) || summaries[0] || null;
  }, [selectedSummaryId, summaries]);

  const value = useMemo<FlowContextValue>(
    () => ({
      ...state,
      view,
      isSyncing,
      isExecuting,
      activeStep,
      lastExecution,
      summaries,
      selectedSummary,
      selectSummary,
      deleteSummary,
      fetchSummaries,
      toggleView: () => setView((v) => (v === "dashboard" ? "settings" : "dashboard")),
      setApiKey: (apiKey) => patch({ apiKey, hasApiKey: Boolean(apiKey && apiKey.length > 5) }),
      setPromptInstructions: (promptInstructions) => patch({ promptInstructions }),
      setScheduledTime: (scheduledTime) => patch({ scheduledTime }),
      addSearchUrl,
      updateSearchUrl,
      removeSearchUrl,
      saveSettingsToBackend,
      triggerTestRun,
      fetchStatus,
    }),
    [
      state,
      view,
      isSyncing,
      isExecuting,
      activeStep,
      lastExecution,
      summaries,
      selectedSummary,
      selectSummary,
      deleteSummary,
      fetchSummaries,
      patch,
      addSearchUrl,
      updateSearchUrl,
      removeSearchUrl,
      saveSettingsToBackend,
      triggerTestRun,
      fetchStatus,
    ]
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
