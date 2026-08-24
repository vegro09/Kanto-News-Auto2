import FlowCanvas from "@/components/FlowCanvas";
import SummaryReader from "@/components/SummaryReader";
import { useFlow } from "@/lib/flow-store";
import { Play, Loader2 } from "lucide-react";

export default function Dashboard() {
  const {
    searchUrls,
    scheduledTime,
    summaries,
    isExecuting,
    activeStep,
    triggerTestRun,
  } = useFlow();

  const getStatusLabel = () => {
    switch (activeStep) {
      case "fetch":
        return "1/3 Fetching RSS & Web Sources...";
      case "ai":
        return "2/3 Gemini Arabic Summarization in progress...";
      case "storage":
        return "3/3 Archiving digest to Local Storage (summaries.json)...";
      case "done":
        return "Pipeline execution completed & archived.";
      case "error":
        return "Pipeline encountered an error.";
      default:
        return "Local Intelligence Engine Idle · Ready";
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Top Action & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-3.5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
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
      <div className="flex items-center justify-center overflow-x-auto px-6 py-10 md:px-10">
        <FlowCanvas />
      </div>

      {/* The Reader Component (Local Archive Viewer) */}
      <SummaryReader />

      {/* Footer Info */}
      <footer className="flex flex-wrap items-center gap-x-10 gap-y-2 border-t border-border px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:px-10">
        <span>Schedule · {scheduledTime || "07:00"} (Daily Cron)</span>
        <span>Sources · {searchUrls.length} Active</span>
        <span>Local Archive · {summaries.length} Briefs</span>
        <span>Mode · Local Intelligence Storage</span>
        <span className="ml-auto">Kanto Empire · Strict Dynamic Flat UI</span>
      </footer>
    </main>
  );
}
