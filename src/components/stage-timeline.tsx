import { clsx } from "clsx";
import { Check } from "@/components/icons";
import { formatDate } from "@/lib/format";
import type { RouteTemplate, StageEvent } from "@/lib/types";

/** Vertical holographic timeline: done / current / upcoming with dates and consultant notes. */
export function StageTimeline({
  route,
  currentStageId,
  events,
}: {
  route: RouteTemplate;
  currentStageId: string | null;
  events: StageEvent[];
}) {
  const currentPos = route.stages.find((s) => s.id === currentStageId)?.position ?? 0;
  return (
    <ol className="relative">
      {route.stages.map((s, i) => {
        const state = s.position < currentPos ? "done" : s.position === currentPos ? "current" : "next";
        const reached = [...events].reverse().find((e) => e.stageId === s.id);
        const last = i === route.stages.length - 1;
        return (
          <li key={s.id} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={clsx(
                  "absolute left-[17px] top-10 bottom-0 w-px",
                  state === "done" ? "bg-[linear-gradient(180deg,#f2c46d,#f2c46d80)]" : "bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.15)_0_4px,transparent_4px_8px)]",
                )}
              />
            )}
            <span
              className={clsx(
                "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-medium",
                state === "done" && "border-gold bg-gold text-ink shadow-[0_0_18px_-2px_rgba(242,196,109,0.7)]",
                state === "current" && "border-cyan bg-cyan/10 text-cyan shadow-[0_0_24px_-2px_rgba(91,231,224,0.8)]",
                state === "next" && "border-line bg-ink text-dim",
              )}
            >
              {state === "done" ? <Check size={16} strokeWidth={2.5} /> : s.position}
              {state === "current" && <span className="absolute inset-0 animate-pulse-ring rounded-full border border-cyan" />}
            </span>
            <div className={clsx("min-w-0 flex-1 pt-1", state === "current" && "-mt-1 rounded-2xl border border-cyan/25 bg-cyan/[0.05] p-4")}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className={clsx("font-medium", state === "next" && "text-muted")}>{s.title}</p>
                {state === "current" ? (
                  <span className="hud text-[0.6rem] text-cyan">Current stage</span>
                ) : reached && state === "done" ? (
                  <span className="font-mono text-xs text-dim">{formatDate(reached.createdAt)}</span>
                ) : null}
              </div>
              <p className={clsx("mt-0.5 text-sm", state === "next" ? "text-dim" : "text-muted")}>{s.description}</p>
              {reached?.note && state !== "next" && (
                <p className="mt-3 rounded-xl border-l-2 border-gold bg-white/[0.03] px-3 py-2 text-sm text-text/90">
                  {reached.note}
                  <span className="mt-1 block text-xs text-dim">— {reached.actorName}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
