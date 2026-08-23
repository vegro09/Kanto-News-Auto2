import { useState } from "react";
import FlowCanvas from "@/components/FlowCanvas";
import { useFlow } from "@/lib/flow-store";
import { Play, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Sparkles, Mail } from "lucide-react";

export default function Dashboard() {
  const {
    searchUrls,
    scheduledTime,
    googleConnected,
    googleUserEmail,
    isExecuting,
    activeStep,
    lastExecution,
    triggerTestRun,
  } = useFlow();

  const [showSummary, setShowSummary] = useState(true);

  const getStatusLabel = () => {
    switch (activeStep) {
      case "fetch":
        return "1/3 Fetching RSS & web sources...";
      case "ai":
        return "2/3 Gemini Arabic Summarization in progress...";
      case "email":
        return "3/3 Dispatching via Gmail API (OAuth2)...";
      case "done":
        return "Pipeline run completed successfully.";
      case "error":
        return "Pipeline encountered an error.";
      default:
        return "Core Engine Idle · Ready";
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Action & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-3 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isExecuting
                  ? "bg-foreground animate-ping"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs uppercase tracking-[0.2em] text-foreground font-mono">
              STATUS: <span className="text-muted-foreground">{getStatusLabel()}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isExecuting}
            onClick={() => triggerTestRun()}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
              isExecuting
                ? "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                : "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background cursor-pointer"
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Run Pipeline Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* SVG Canvas Flow Visualizer */}
      <div className="flex flex-1 items-center justify-center overflow-x-auto px-6 py-10 md:px-10">
        <FlowCanvas />
      </div>

      {/* Latest Execution Output & Arabic Summary Panel */}
      {lastExecution && (
        <div className="border-t border-border bg-background px-6 py-4 md:px-10">
          <div className="mx-auto max-w-5xl">
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                {lastExecution.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                  Latest Brief ({lastExecution.status.toUpperCase()}) · {lastExecution.totalArticlesFetched || 0} Items Processed
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {lastExecution.durationMs ? `${(lastExecution.durationMs / 1000).toFixed(2)}s` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <span>{showSummary ? "Collapse" : "Expand Summary"}</span>
                {showSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {showSummary && lastExecution.aiSummary && (
              <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-5">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    <Sparkles className="h-3.5 w-3.5 text-foreground" />
                    AI Summary Engine · Arabic Output
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <Mail className="h-3 w-3" />
                    Gmail API: {lastExecution.emailSentTo || googleUserEmail || "Self-Delivery"}
                  </div>
                </div>
                <div
                  dir="rtl"
                  className="font-sans text-sm leading-relaxed text-foreground whitespace-pre-line text-right"
                  style={{ fontFamily: "Tajawal, Inter, sans-serif" }}
                >
                  {lastExecution.aiSummary}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="flex flex-wrap items-center gap-x-10 gap-y-2 border-t border-border px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:px-10">
        <span>Schedule · {scheduledTime || "07:00"}</span>
        <span>Sources · {searchUrls.length} Active</span>
        <span>Gmail Account · {googleUserEmail || (googleConnected ? "OAuth Connected" : "Unlinked")}</span>
        <span>Auth · {googleConnected ? "Google OAuth2 (Offline)" : "Awaiting Login"}</span>
        <span className="ml-auto">Kanto Empire · Strict Dynamic Flat UI</span>
      </footer>
    </main>
  );
}
