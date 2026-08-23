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
export type ExecutionStep = "idle" | "fetch" | "ai" | "email" | "done" | "error";

const STORAGE_KEY = "kanto-flow-state-v2";

export interface ExecutionLogItem {
  timestamp: string;
  step: "fetch" | "ai" | "email" | "system";
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
  emailSentTo?: string;
  emailPreviewUrl?: string;
  error?: string;
  logs?: ExecutionLogItem[];
}

export interface PersistedState {
  searchUrls: string[];
  apiKey: string;
  hasApiKey: boolean;
  promptInstructions: string;
  scheduledTime: string;
  recipientEmail: string;
  googleConnected: boolean;
  smtpConfigured: boolean;
}

interface FlowContextValue extends PersistedState {
  view: View;
  toggleView: () => void;
  setApiKey: (value: string) => void;
  setPromptInstructions: (value: string) => void;
  setScheduledTime: (value: string) => void;
  setRecipientEmail: (value: string) => void;
  setGoogleConnected: (value: boolean) => void;
  addSearchUrl: () => void;
  updateSearchUrl: (index: number, url: string) => void;
  removeSearchUrl: (index: number) => void;
  isSyncing: boolean;
  isExecuting: boolean;
  activeStep: ExecutionStep;
  lastExecution: PipelineExecutionResult | null;
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
    "قم بتلخيص أهم الأخبار والبيانات في موجز صباحي تقني موجز ومركّز. رتّب النقاط حسب الأهمية في مجالات الذكاء الاصطناعي، البنية التحتية، وتطوير البرمجيات.",
  scheduledTime: "07:00",
  recipientEmail: "commander@kanto.empire",
  googleConnected: false,
  smtpConfigured: false,
};

const API_BASE = ""; // Relative path works with Vite proxy

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [view, setView] = useState<View>("dashboard");
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStep, setActiveStep] = useState<ExecutionStep>("idle");
  const [lastExecution, setLastExecution] = useState<PipelineExecutionResult | null>(null);

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

  // Fetch live settings and status from Express backend on mount
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
              recipientEmail: data.settings.recipientEmail || prev.recipientEmail,
              googleConnected: data.settings.googleConnected ?? prev.googleConnected,
              smtpConfigured: data.settings.smtpConfigured ?? false,
            }));
          }
        }

        const statusRes = await fetch(`${API_BASE}/api/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.lastExecution) {
            setLastExecution(statusData.lastExecution);
          }
        }
      } catch {
        // Backend not yet reachable or in dev standalone mode
      }
    }

    loadBackendData();
  }, []);

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
              smtpConfigured: data.settings.smtpConfigured ?? prev.smtpConfigured,
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

    // Simulate animated step progression for visual feedback while waiting for server response
    const fetchTimer = setTimeout(() => setActiveStep("ai"), 900);
    const aiTimer = setTimeout(() => setActiveStep("email"), 2200);

    try {
      // First ensure backend has latest state
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
      // Reset active step back to idle after 4 seconds
      setTimeout(() => {
        setActiveStep("idle");
      }, 4000);
    }
  }, [isExecuting, saveSettingsToBackend]);

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

  const value = useMemo<FlowContextValue>(
    () => ({
      ...state,
      view,
      isSyncing,
      isExecuting,
      activeStep,
      lastExecution,
      toggleView: () => setView((v) => (v === "dashboard" ? "settings" : "dashboard")),
      setApiKey: (apiKey) => patch({ apiKey, hasApiKey: Boolean(apiKey && apiKey.length > 5) }),
      setPromptInstructions: (promptInstructions) => patch({ promptInstructions }),
      setScheduledTime: (scheduledTime) => patch({ scheduledTime }),
      setRecipientEmail: (recipientEmail) => patch({ recipientEmail }),
      setGoogleConnected: (googleConnected) => patch({ googleConnected }),
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
