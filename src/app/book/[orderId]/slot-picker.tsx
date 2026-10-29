"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Loader2 } from "@/components/icons";
import { Button } from "@/components/ui";
import { bookDemoSlot } from "./actions";

const TIMES = [10, 11.5, 14, 16]; // WAT hours

function nextWeekdays(n: number) {
  const days: Date[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (days.length < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(new Date(d));
  }
  return days;
}

export function SlotPicker({ orderId }: { orderId: string }) {
  const days = useMemo(() => nextWeekdays(6), []);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const slots = TIMES.map((h) => {
    const s = new Date(days[day]);
    s.setUTCHours(Math.floor(h) - 1, (h % 1) * 60); // WAT = UTC+1
    return s.toISOString();
  });

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {days.map((d, i) => (
          <button
            key={d.toISOString()}
            onClick={() => {
              setDay(i);
              setSlot(null);
            }}
            className={clsx(
              "flex min-w-[68px] flex-col items-center rounded-2xl border px-3 py-3 transition",
              i === day ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-muted hover:border-white/20",
            )}
          >
            <span className="hud text-[0.55rem]">{d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
            <span className="mt-1 font-display text-xl">{d.getUTCDate()}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className={clsx(
              "rounded-xl border py-3 font-mono text-sm transition",
              slot === s ? "border-cyan/60 bg-cyan/10 text-cyan shadow-[0_0_20px_-6px_#5be7e0]" : "border-line hover:border-white/20",
            )}
          >
            {new Date(s).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}
          </button>
        ))}
      </div>
      <Button className="mt-6 w-full" size="lg" disabled={!slot || pending} onClick={() => slot && start(() => bookDemoSlot(orderId, slot))}>
        {pending && <Loader2 size={18} className="animate-spin" />} Confirm booking
      </Button>
      <p className="mt-3 text-center text-xs text-dim">Times shown in WAT (Lagos). Live version uses Cal.com.</p>
    </div>
  );
}
