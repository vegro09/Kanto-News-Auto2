import { useState } from "react";
import { Check, Chrome, Plus, Trash2, Save, Play, Loader2, KeyRound, ShieldCheck } from "lucide-react";
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
      <h2 className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">{title}</h2>
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
    hasApiKey,
    promptInstructions,
    scheduledTime,
    googleConnected,
    googleUserEmail,
    hasGoogleRefreshToken,
    isSyncing,
    isExecuting,
    setApiKey,
    setPromptInstructions,
    setScheduledTime,
    addSearchUrl,
    updateSearchUrl,
    removeSearchUrl,
    saveSettingsToBackend,
    triggerTestRun,
    initiateGoogleLogin,
    disconnectGoogle,
  } = useFlow();

  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const handleSave = async () => {
    const ok = await saveSettingsToBackend();
    if (ok) {
      setSavedStatus("Settings synchronized with Kanto Core Engine.");
      setTimeout(() => setSavedStatus(null), 3000);
    } else {
      setSavedStatus("Saved to local browser storage.");
      setTimeout(() => setSavedStatus(null), 3000);
    }
  };

  return (
    <main className="flex-1 px-6 py-16 md:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl italic text-foreground">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Google OAuth2 & Gmail API automated engine configuration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg border border-foreground bg-foreground px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-background transition-colors hover:bg-background hover:text-foreground cursor-pointer"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save to Engine
            </button>
          </div>
        </div>

        {savedStatus && (
          <div className="mt-4 rounded-lg border border-foreground/30 bg-secondary/30 px-4 py-2.5 text-xs text-foreground font-mono">
            ✓ {savedStatus}
          </div>
        )}

        <div className="mt-12 divide-y divide-border border-y border-border">
          {/* Google OAuth2 & Gmail API */}
          <Section
            title="Google OAuth2 & Gmail API Delivery"
            description="Authorize via Google OAuth2 with offline consent. The engine uses your stored refresh token to send AI digests directly to and from your Google account."
          >
            <div className="flex flex-col gap-4">
              {googleConnected ? (
                <div className="flex flex-col gap-3 rounded-lg border border-foreground bg-secondary/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-foreground font-mono">
                      <ShieldCheck className="h-4 w-4 text-foreground" />
                      <span>{googleUserEmail || "Google Account Connected"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={disconnectGoogle}
                      className="text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span>Scope: gmail.send · Mode: Self-Delivery (From: You → To: You)</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={initiateGoogleLogin}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-foreground px-4 py-3 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background cursor-pointer"
                  >
                    <Chrome className="h-4 w-4" />
                    Sign in with Google (OAuth2 + Gmail API)
                  </button>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Requests offline access to automatically obtain a refresh_token for daily 07:00 AM dispatch.
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Schedule */}
          <Section
            title="Schedule (node-cron)"
            description="Daily trigger time (24-hr HH:mm). Recalibrates the background cron task dynamically."
          >
            <div className="flex items-center gap-4">
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className={`${inputClass} max-w-56 font-mono text-base`}
                aria-label="Scheduled time"
              />
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Daily Gmail Trigger
              </span>
            </div>
          </Section>

          {/* API Key */}
          <Section
            title="Google Gemini API Key"
            description="API credential for @google/generative-ai Arabic summarization pipeline."
          >
            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasApiKey ? "•••••••••••••••• (API Key Active)" : "Enter Gemini API Key (AIzaSy...)"}
                autoComplete="off"
                className={inputClass}
                aria-label="API key"
              />
              <p className="text-[11px] text-muted-foreground font-mono">
                {hasApiKey ? "✓ API Key active in backend." : "Key is stored in-memory and in .env for security."}
              </p>
            </div>
          </Section>

          {/* AI Instructions */}
          <Section
            title="AI Instructions / Custom Prompt"
            description="Custom prompt instructions applied to all gathered RSS and text feeds for Arabic summarization."
          >
            <textarea
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              rows={5}
              placeholder="صف كيفية تلخيص المحتوى المجلوب باللغة العربية..."
              dir="rtl"
              style={{ fontFamily: "Tajawal, Inter, sans-serif" }}
              className={`${inputClass} resize-y leading-relaxed text-right`}
              aria-label="AI instructions"
            />
          </Section>

          {/* URL Sources */}
          <Section
            title="URL Sources (RSS / Atom / Web)"
            description="Sources queried during each scheduled automation run."
          >
            <div className="flex flex-col gap-3">
              {searchUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateSearchUrl(i, e.target.value)}
                    placeholder="https://example.com/rss"
                    className={inputClass}
                    aria-label={`Source URL ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSearchUrl(i)}
                    aria-label={`Remove source ${i + 1}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSearchUrl}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Source URL
              </button>
            </div>
          </Section>

          {/* Manual Run Test */}
          <Section
            title="Manual Pipeline Test"
            description="Execute the complete SaaS flow immediately (Fetch -> Gemini AI -> Gmail API Dispatch)."
          >
            <button
              type="button"
              onClick={() => triggerTestRun()}
              disabled={isExecuting}
              className="flex items-center justify-center gap-3 rounded-lg border border-foreground px-6 py-3 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing Pipeline...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Trigger Test Run Now
                </>
              )}
            </button>
          </Section>
        </div>
      </div>
    </main>
  );
}
