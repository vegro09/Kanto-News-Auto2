import { useState } from "react";
import { useFlow, StoredSummaryItem } from "@/lib/flow-store";
import {
  BookOpen,
  Calendar,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Languages,
} from "lucide-react";

function formatDigestContent(content: string) {
  if (!content) return "";

  // Split by main sections if bilingual
  return content;
}

export default function SummaryReader() {
  const {
    summaries,
    selectedSummary,
    selectSummary,
    deleteSummary,
    triggerTestRun,
    isExecuting,
  } = useFlow();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!selectedSummary?.summaryArabic) return;
    navigator.clipboard.writeText(selectedSummary.summaryArabic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdownText = (text: string) => {
    // Process markdown headers, bold, and links cleanly
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        const isEnglish = /^[#\s]*SECTION 2|^[#\s]*ENGLISH/i.test(trimmed);
        return (
          <h1
            key={idx}
            dir={isEnglish ? "ltr" : "rtl"}
            className="font-serif text-2xl italic text-foreground mt-8 mb-4 border-b border-border pb-2"
          >
            {trimmed.replace(/^#\s+/, "")}
          </h1>
        );
      }

      if (trimmed.startsWith("## ")) {
        const isEnglish = /^[#\s]*\d*\.?\s*[A-Za-z]/.test(trimmed);
        return (
          <h2
            key={idx}
            dir={isEnglish ? "ltr" : "rtl"}
            className="text-lg font-bold text-foreground mt-6 mb-2 tracking-wide font-mono uppercase text-xs"
          >
            {trimmed.replace(/^##\s+/, "")}
          </h2>
        );
      }

      if (trimmed.startsWith("### ")) {
        const isPriority = /HIGH PRIORITY|أولوية قصوى/i.test(trimmed);
        const isEnglish = /[a-zA-Z]/.test(trimmed.slice(0, 10));
        return (
          <div
            key={idx}
            dir={isEnglish ? "ltr" : "rtl"}
            className={`mt-4 mb-2 flex items-center justify-between rounded-lg border p-2.5 ${
              isPriority
                ? "border-foreground bg-secondary/60 text-foreground font-bold"
                : "border-border bg-background"
            }`}
          >
            <span className="text-sm font-semibold">{trimmed.replace(/^###\s+/, "")}</span>
            {isPriority && (
              <span className="rounded bg-foreground px-2 py-0.5 text-[9px] uppercase tracking-wider text-background font-mono font-bold">
                PRIORITY
              </span>
            )}
          </div>
        );
      }

      if (trimmed.startsWith("---") || trimmed.startsWith("===")) {
        return <hr key={idx} className="my-6 border-border" />;
      }

      // Check if line contains a markdown link [text](url)
      const linkMatch = line.match(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/);
      if (linkMatch) {
        const [full, linkText, url] = linkMatch;
        const prefix = line.slice(0, line.indexOf(full));
        const isEnglish = /[a-zA-Z]/.test(prefix.slice(0, 10));

        return (
          <p
            key={idx}
            dir={isEnglish ? "ltr" : "rtl"}
            className="my-2.5 text-sm leading-relaxed text-foreground font-mono flex items-center gap-2 flex-wrap"
          >
            <span>{prefix}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-foreground bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-foreground hover:text-background font-sans"
            >
              <span>{linkText}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        );
      }

      if (trimmed.length === 0) {
        return <div key={idx} className="h-2" />;
      }

      const isEnglish = /^[a-zA-Z0-9\s\-_:.]/.test(trimmed);
      return (
        <p
          key={idx}
          dir={isEnglish ? "ltr" : "rtl"}
          className={`my-1 text-sm leading-relaxed text-foreground ${
            isEnglish ? "text-left font-sans" : "text-right"
          }`}
          style={{ fontFamily: isEnglish ? "Inter, sans-serif" : "Tajawal, Inter, sans-serif" }}
        >
          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      );
    });
  };

  if (summaries.length === 0) {
    return (
      <section className="border-t border-border bg-background px-6 py-12 md:px-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-border p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-xl italic text-foreground">
            Local Intelligence Archive Empty
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No digests have been archived yet. Run a pipeline test or wait for the scheduled daily execution to generate your first bilingual intelligence brief.
          </p>
          <button
            type="button"
            onClick={() => triggerTestRun()}
            disabled={isExecuting}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-foreground bg-foreground px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-background transition-colors hover:bg-background hover:text-foreground cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isExecuting ? "Executing Pipeline..." : "Generate First Bilingual Digest"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border bg-background px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Reader Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-foreground bg-background text-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-xl italic text-foreground flex items-center gap-2">
                The Reader · Bilingual Intelligence Archive
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {summaries.length} Brief(s) stored in data/summaries.json · Arabic & English Sections · Zero Emojis
              </p>
            </div>
          </div>

          {selectedSummary && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground cursor-pointer font-mono"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Brief"}
              </button>
              <button
                type="button"
                onClick={() => deleteSummary(selectedSummary.id)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive cursor-pointer font-mono"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Digest History List (Left Column) */}
          <div className="flex flex-col gap-2.5 lg:col-span-4">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-1">
              Archived Briefs
            </span>
            <div className="flex flex-col gap-2 max-h-[560px] overflow-y-auto pr-1">
              {summaries.map((item) => {
                const isSelected = selectedSummary?.id === item.id;
                const formattedDate = new Date(item.timestamp).toLocaleString("ar-SA", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectSummary(item.id)}
                    className={`flex flex-col gap-1.5 rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "border-foreground bg-secondary/40"
                        : "border-border bg-background hover:border-muted-foreground/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
                        {item.triggerType === "scheduled" ? "⏰ SCHEDULED" : "⚡ MANUAL"}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span
                        dir="rtl"
                        className="truncate text-sm font-medium text-foreground text-right"
                        style={{ fontFamily: "Tajawal, Inter, sans-serif" }}
                      >
                        {item.title}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? "text-foreground translate-x-0.5" : "text-muted-foreground/40"
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                      <span>{item.sourcesProcessed} sources</span>
                      <span>·</span>
                      <span>{item.totalArticlesFetched} items</span>
                      <span>·</span>
                      <span>{(item.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Reader Viewer (Right Column) */}
          <div className="lg:col-span-8">
            {selectedSummary ? (
              <div className="rounded-lg border border-border bg-secondary/15 p-6 md:p-8">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-6 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-foreground" />
                    <span>{new Date(selectedSummary.timestamp).toLocaleString("ar-SA")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Languages className="h-3.5 w-3.5 text-foreground" />
                      Bilingual (Arabic / English)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {selectedSummary.sourcesProcessed} Sources ({selectedSummary.totalArticlesFetched} Items)
                    </span>
                    <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase">
                      {selectedSummary.model}
                    </span>
                  </div>
                </div>

                {/* Sources Pill Row */}
                {selectedSummary.sources && selectedSummary.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedSummary.sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded border border-border bg-background px-2.5 py-1 text-[11px] font-mono text-muted-foreground"
                      >
                        {s.title} ({s.articlesCount})
                      </span>
                    ))}
                  </div>
                )}

                {/* Rendered Bilingual Markdown Content */}
                <div className="space-y-1">
                  {renderMarkdownText(selectedSummary.summaryArabic)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
