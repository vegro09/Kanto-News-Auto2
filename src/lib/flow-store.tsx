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

const STORAGE_KEY = "kanto-flow-state-v3";

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
  emailDeliveryMethod?: "gmail_api" | "simulated";
  gmailMessageId?: string;
  error?: string;
  logs?: ExecutionLogItem[];
}

export interface PersistedState {
  searchUrls: string[];
  apiKey: string;
  hasApiKey: boolean;
  promptInstructions: string;
  scheduledTime: string;
  googleConnected: boolean;
  googleUserEmail: string;
  hasGoogleRefreshToken: boolean;
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
  saveSettingsToBackend: (customUpdates?: Partial<PersistedState>) => Promise<boolean>;
  triggerTestRun: () => Promise<PipelineExecutionResult | null>;
  initiateGoogleLogin: () => void;
  disconnectGoogle: () => Promise<void>;
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
  googleConnected: false,
  googleUserEmail: "",
  hasGoogleRefreshToken: false,
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

  // Check URL search params for OAuth redirects (?auth=success&email=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");
    const emailParam = params.get("email");

    if (authStatus === "success" && emailParam) {
      setState((prev) => ({
        ...prev,
        googleConnected: true,
        googleUserEmail: decodeURIComponent(emailParam),
        hasGoogleRefreshToken: true,
      }));
      // Clean up search parameters in URL without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch live settings and OAuth status from Express backend on mount
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
              googleConnected: data.settings.googleConnected ?? prev.googleConnected,
              googleUserEmail: data.settings.googleUserEmail || prev.googleUserEmail,
              hasGoogleRefreshToken: data.settings.hasGoogleRefreshToken ?? prev.hasGoogleRefreshToken,
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
        // Backend not yet reachable or dev mode
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

  // Initiate Google OAuth2 Flow
  const initiateGoogleLogin = useCallback(() => {
    // Redirect directly to backend OAuth entry point which requests offline refresh_token
    window.location.href = `${API_BASE}/api/auth/google`;
  }, []);

  // Disconnect Google account
  const disconnectGoogle = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/google/disconnect`, { method: "POST" });
      setState((prev) => ({
        ...prev,
        googleConnected: false,
        googleUserEmail: "",
        hasGoogleRefreshToken: false,
      }));
    } catch (err) {
      console.error("Failed to disconnect Google OAuth:", err);
    }
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
              googleConnected: data.settings.googleConnected ?? prev.googleConnected,
              googleUserEmail: data.settings.googleUserEmail || prev.googleUserEmail,
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
    const aiTimer = setTimeout(() => setActiveStep("email"), 2200);

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
      addSearchUrl,
      updateSearchUrl,
      removeSearchUrl,
      saveSettingsToBackend,
      triggerTestRun,
      initiateGoogleLogin,
      disconnectGoogle,
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
      initiateGoogleLogin,
      disconnectGoogle,
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
