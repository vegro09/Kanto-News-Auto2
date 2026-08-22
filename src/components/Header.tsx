import { Settings, Workflow } from "lucide-react";
import { useFlow } from "@/lib/flow-store";

export default function Header() {
  const { view, toggleView } = useFlow();
  const onDashboard = view === "dashboard";

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10">
      <button
        type="button"
        onClick={onDashboard ? undefined : toggleView}
        className="cursor-pointer text-left font-serif text-2xl italic leading-none text-foreground"
        aria-label="Kanto Automator home"
      >
        Kanto <span className="text-muted-foreground">Automator</span>
      </button>
      <button
        type="button"
        onClick={toggleView}
        aria-label={onDashboard ? "Open settings" : "Back to flow dashboard"}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-foreground"
      >
        {onDashboard ? <Settings className="h-4 w-4" /> : <Workflow className="h-4 w-4" />}
      </button>
    </header>
  );
}
