"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

export function Countdown({ date, time }: { date: string; time: string }) {
  // Parse once on the client. Parsing on the server would use the server time
  // zone and produce a hydration mismatch for visitors in other zones.
  const [target, setTarget] = useState<number | null>(null);
  const [left, setLeft] = useState(() => ({
    total: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  }));

  useEffect(() => {
    // Kick-off times are East Africa Time (UTC+3, no DST).
    const when = new Date(`${date}T${time || "00:00"}:00+03:00`).getTime();
    if (Number.isNaN(when)) {
      setTarget(0);
      return;
    }
    setTarget(when);
  }, [date, time]);

  useEffect(() => {
    if (target === null) return;
    const tick = () => setLeft(diff(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (target === null) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        {["Days", "Hours", "Mins", "Secs"].map((label) => (
          <div
            key={label}
            className="min-w-[64px] rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-center"
          >
            <div className="font-display text-2xl tabular-nums text-white/40">--</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
              {label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (left.total <= 0) {
    return (
      <div className="rounded-sm border border-white/15 bg-black/40 px-4 py-3 font-display text-lg uppercase text-spartan-gold">
        Matchday
      </div>
    );
  }

  const cells = [
    { label: "Days", value: left.days },
    { label: "Hours", value: left.hours },
    { label: "Mins", value: left.minutes },
    { label: "Secs", value: left.seconds },
  ];

  return (
    <div className="flex gap-2">
      {cells.map((c) => (
        <div
          key={c.label}
          className="min-w-[64px] rounded-sm border border-white/15 bg-black/40 px-3 py-2 text-center"
        >
          <div className="font-display text-2xl tabular-nums">
            {String(c.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-spartan-gold">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
