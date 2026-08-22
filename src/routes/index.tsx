import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/Dashboard";
import Header from "@/components/Header";
import SettingsView from "@/components/SettingsView";
import { FlowProvider, useFlow } from "@/lib/flow-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanto Automator — AI Automation Flow Visualizer" },
      {
        name: "description",
        content:
          "A flat, node-based visualizer for scheduled AI automations — timer, search sources, AI engine, and email delivery on one Kanto canvas.",
      },
      { property: "og:title", content: "Kanto Automator — AI Automation Flow Visualizer" },
      {
        property: "og:description",
        content:
          "A flat, node-based visualizer for scheduled AI automations — timer, search sources, AI engine, and email delivery on one Kanto canvas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function AppShell() {
  const { view } = useFlow();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      {view === "dashboard" ? <Dashboard /> : <SettingsView />}
    </div>
  );
}

function Index() {
  return (
    <FlowProvider>
      <AppShell />
    </FlowProvider>
  );
}
