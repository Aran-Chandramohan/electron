import { useEffect, useState } from 'react';
import { topPxForTime } from './timeGrid';

// A horizontal red line + dot marking "now" within a day column. Recomputes
// every 60s (not on every render) — cheap enough and matches how often the
// displayed position actually needs to change.
export function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top: `${topPxForTime(now)}px` }}
    >
      <div className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}
