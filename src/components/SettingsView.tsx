import { Check, Chrome, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFlow } from "@/lib/flow-store";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-10">
      <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const inputClass =
  "w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

export default function SettingsView() {
  const {
    searchUrls,
    apiKey,
    promptInstructions,
    scheduledTime,
    googleConnected,
    setApiKey,
    setPromptInstructions,
    setScheduledTime,
    setGoogleConnected,
    addSearchUrl,
    updateSearchUrl,
    removeSearchUrl,
  } = useFlow();

  return (
    <main className="flex-1 px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-serif text-4xl italic text-foreground">Settings</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Configuration persists locally and drives the dashboard graph in real time.
        </p>

        <div className="mt-12 divide-y divide-border border-y border-border">
          <Section
            title="Email Connection"
            description="Authorize the Google account used for digest delivery."
          >
            {googleConnected ? (
              <div className="flex items-center justify-between rounded-lg border border-foreground px-4 py-3">
                <span className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4" />
                  Connected · flow@kanto.empire
                </span>
                <button
                  type="button"
                  onClick={() => setGoogleConnected(false)}
                  className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setGoogleConnected(true)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-foreground px-4 py-3 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <Chrome className="h-4 w-4" />
                Sign in with Google
              </button>
            )}
          </Section>

          <Section
            title="Schedule"
            description="Daily trigger time for the automation run."
          >
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className={`${inputClass} max-w-56`}
              aria-label="Scheduled time"
            />
          </Section>

          <Section
            title="API Key"
            description="Secret credential for the AI engine. Stored locally, never displayed."
          >
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-••••••••••••••••"
              autoComplete="off"
              className={inputClass}
              aria-label="API key"
            />
          </Section>

          <Section
            title="AI Instructions"
            description="The prompt the engine applies to every collected source."
          >
            <textarea
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              rows={5}
              placeholder="Describe how the AI engine should process the collected material…"
              className={`${inputClass} resize-y leading-relaxed`}
              aria-label="AI instructions"
            />
          </Section>

          <Section
            title="URL Sources"
            description="Each source renders as a node on the dashboard canvas."
          >
            <div className="flex flex-col gap-3">
              {searchUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateSearchUrl(i, e.target.value)}
                    placeholder="https://example.com/feed"
                    className={inputClass}
                    aria-label={`Source URL ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSearchUrl(i)}
                    aria-label={`Remove source ${i + 1}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSearchUrl}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
                Add Source
              </button>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
