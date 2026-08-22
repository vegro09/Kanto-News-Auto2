import FlowCanvas from "@/components/FlowCanvas";
import { useFlow } from "@/lib/flow-store";

export default function Dashboard() {
  const { searchUrls, scheduledTime, googleConnected } = useFlow();

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 items-center overflow-x-auto px-6 py-12 md:px-10">
        <FlowCanvas />
      </div>
      <footer className="flex flex-wrap items-center gap-x-10 gap-y-2 border-t border-border px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground md:px-10">
        <span>Schedule · {scheduledTime || "Unset"}</span>
        <span>Sources · {searchUrls.length}</span>
        <span>OAuth · {googleConnected ? "Connected" : "Not connected"}</span>
        <span className="ml-auto">Kanto Empire · Read-only</span>
      </footer>
    </main>
  );
}
