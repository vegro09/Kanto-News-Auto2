import { Cpu, Globe, FolderArchive, Timer, type LucideIcon } from "lucide-react";
import { useFlow } from "@/lib/flow-store";

const NODE_W = 240;
const NODE_H = 76;
const COL_GAP = 150;
const ROW_GAP = 28;
const PAD_X = 8;
const PAD_Y = 64;

const xCol = (col: number) => PAD_X + col * (NODE_W + COL_GAP);
const midY = (y: number) => y + NODE_H / 2;

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "—";
  }
}

function Edge({
  x1,
  y1,
  x2,
  y2,
  active = false,
  ghost = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
  ghost?: boolean;
}) {
  const dx = Math.max(60, (x2 - x1) / 2);
  return (
    <path
      d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke="var(--color-foreground)"
      strokeOpacity={ghost ? 0.25 : active ? 1 : 0.8}
      strokeWidth={active ? 1.5 : 1}
      strokeDasharray={active ? "3 3" : "5 7"}
      className="edge-flow"
    />
  );
}

function FlowNode({
  x,
  y,
  icon: Icon,
  label,
  value,
  sub,
  statusBadge,
  isActive = false,
  ghost = false,
}: {
  x: number;
  y: number;
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string | undefined;
  statusBadge?: string;
  isActive?: boolean;
  ghost?: boolean;
}) {
  return (
    <foreignObject x={x} y={y} width={NODE_W} height={NODE_H}>
      <div
        className={`flex h-full w-full items-center justify-between gap-3 rounded-lg border bg-background px-4 transition-colors ${
          isActive
            ? "border-foreground bg-secondary/40"
            : ghost
            ? "border-dashed border-border"
            : "border-border hover:border-foreground"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <Icon
            className={`h-4 w-4 shrink-0 ${
              isActive
                ? "text-foreground"
                : ghost
                ? "text-muted-foreground"
                : "text-foreground"
            }`}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono">
              {label}
            </span>
            <span
              className={`truncate text-sm font-medium ${
                ghost ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {value}
            </span>
            {sub ? (
              <span className="truncate text-[11px] text-muted-foreground font-mono">{sub}</span>
            ) : null}
          </div>
        </div>

        {statusBadge ? (
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-mono ${
              isActive
                ? "border-foreground bg-foreground text-background font-bold"
                : "border-border text-muted-foreground"
            }`}
          >
            {statusBadge}
          </span>
        ) : null}
      </div>
    </foreignObject>
  );
}

function ColumnCaption({ x, children }: { x: number; children: string }) {
  return (
    <text
      x={x + NODE_W / 2}
      y={30}
      textAnchor="middle"
      fontSize={10}
      letterSpacing={3}
      className="fill-muted-foreground uppercase font-mono"
    >
      {children}
    </text>
  );
}

export default function FlowCanvas() {
  const {
    searchUrls,
    scheduledTime,
    promptInstructions,
    summaries,
    activeStep,
    isExecuting,
  } = useFlow();

  const hasSources = searchUrls.length > 0;
  const colCount = Math.max(searchUrls.length, 1);
  const colHeight = colCount * NODE_H + (colCount - 1) * ROW_GAP;
  const height = colHeight + PAD_Y * 2;
  const width = 4 * NODE_W + 3 * COL_GAP + PAD_X * 2;
  const centerY = height / 2;

  const timer = { x: xCol(0), y: centerY - NODE_H / 2 };
  const ai = { x: xCol(2), y: centerY - NODE_H / 2 };
  const storage = { x: xCol(3), y: centerY - NODE_H / 2 };

  const searchTop = centerY - colHeight / 2;
  const sources = (hasSources ? searchUrls : [""]).map((url, i) => ({
    url,
    x: xCol(1),
    y: searchTop + i * (NODE_H + ROW_GAP),
  }));

  const isTimerActive = activeStep === "fetch" || (isExecuting && activeStep === "idle");
  const isFetchActive = activeStep === "fetch";
  const isAiActive = activeStep === "ai";
  const isStorageActive = activeStep === "storage" || activeStep === "done";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full min-w-[880px]"
      role="img"
      aria-label="Automation flow: timer triggers search sources, feeding an AI engine and saving to local storage"
    >
      <ColumnCaption x={timer.x}>Trigger</ColumnCaption>
      <ColumnCaption x={xCol(1)}>Sources</ColumnCaption>
      <ColumnCaption x={ai.x}>Processing</ColumnCaption>
      <ColumnCaption x={storage.x}>Archive</ColumnCaption>

      {sources.map((s, i) => (
        <Edge
          key={`t-s-${i}`}
          x1={timer.x + NODE_W}
          y1={midY(timer.y)}
          x2={s.x}
          y2={midY(s.y)}
          active={isTimerActive || isFetchActive}
          ghost={!hasSources}
        />
      ))}
      {sources.map((s, i) => (
        <Edge
          key={`s-a-${i}`}
          x1={s.x + NODE_W}
          y1={midY(s.y)}
          x2={ai.x}
          y2={midY(ai.y)}
          active={isAiActive}
          ghost={!hasSources}
        />
      ))}
      <Edge
        x1={ai.x + NODE_W}
        y1={midY(ai.y)}
        x2={storage.x}
        y2={midY(storage.y)}
        active={isStorageActive}
      />

      <FlowNode
        x={timer.x}
        y={timer.y}
        icon={Timer}
        label="Timer"
        value={scheduledTime || "07:00"}
        sub="Daily cron trigger"
        isActive={isTimerActive}
        statusBadge={isTimerActive ? "TRIGGER" : "ACTIVE"}
      />

      {sources.map((s, i) =>
        hasSources ? (
          <FlowNode
            key={`search-${i}`}
            x={s.x}
            y={s.y}
            icon={Globe}
            label={`Source ${String(i + 1).padStart(2, "0")}`}
            value={s.url || "Empty URL"}
            sub={hostname(s.url)}
            isActive={isFetchActive}
            statusBadge={isFetchActive ? "FETCHING" : undefined}
          />
        ) : (
          <FlowNode
            key="search-empty"
            x={s.x}
            y={s.y}
            icon={Globe}
            label="Source 00"
            value="No sources configured"
            sub="Add URLs in Settings"
            ghost
          />
        )
      )}

      <FlowNode
        x={ai.x}
        y={ai.y}
        icon={Cpu}
        label="AI Engine"
        value="Gemini Summarizer"
        sub={promptInstructions ? promptInstructions.slice(0, 28) + "..." : "Arabic brief pipeline"}
        isActive={isAiActive}
        statusBadge={isAiActive ? "SUMMARIZING" : undefined}
      />

      <FlowNode
        x={storage.x}
        y={storage.y}
        icon={FolderArchive}
        label="Local Storage"
        value={`${summaries.length} Briefs Archived`}
        sub="data/summaries.json"
        isActive={isStorageActive}
        statusBadge={
          activeStep === "done"
            ? "SAVED"
            : isStorageActive
            ? "ARCHIVING"
            : "PERSISTENT"
        }
      />
    </svg>
  );
}
