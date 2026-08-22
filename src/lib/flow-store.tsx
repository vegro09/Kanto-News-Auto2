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

const STORAGE_KEY = "kanto-flow-state-v1";

interface PersistedState {
  searchUrls: string[];
  apiKey: string;
  promptInstructions: string;
  scheduledTime: string;
  googleConnected: boolean;
}

interface FlowContextValue extends PersistedState {
  view: View;
  toggleView: () => void;
  setApiKey: (value: string) => void;
  setPromptInstructions: (value: string) => void;
  setScheduledTime: (value: string) => void;
  setGoogleConnected: (value: boolean) => void;
  addSearchUrl: () => void;
  updateSearchUrl: (index: number, url: string) => void;
  removeSearchUrl: (index: number) => void;
}

const DEFAULTS: PersistedState = {
  searchUrls: [
    "https://news.ycombinator.com/rss",
    "https://www.theverge.com/rss/index.xml",
  ],
  apiKey: "",
  promptInstructions:
    "Summarize the top 5 stories into a concise morning brief. Rank by relevance to AI infrastructure and developer tooling.",
  scheduledTime: "06:30",
  googleConnected: false,
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(DEFAULTS);
  const [view, setView] = useState<View>("dashboard");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<PersistedState>) });
      }
    } catch {
      // Corrupt or unavailable storage — fall back to defaults.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const patch = useCallback(
    (partial: Partial<PersistedState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    [],
  );

  const addSearchUrl = useCallback(
    () => setState((prev) => ({ ...prev, searchUrls: [...prev.searchUrls, ""] })),
    [],
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

  const value = useMemo<FlowContextValue>(
    () => ({
      ...state,
      view,
      toggleView: () => setView((v) => (v === "dashboard" ? "settings" : "dashboard")),
      setApiKey: (apiKey) => patch({ apiKey }),
      setPromptInstructions: (promptInstructions) => patch({ promptInstructions }),
      setScheduledTime: (scheduledTime) => patch({ scheduledTime }),
      setGoogleConnected: (googleConnected) => patch({ googleConnected }),
      addSearchUrl,
      updateSearchUrl,
      removeSearchUrl,
    }),
    [state, view, patch, addSearchUrl, updateSearchUrl, removeSearchUrl],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
