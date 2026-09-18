// Hour-grid math shared by the Day and Week time-grid views. Kept isolated
// from components so the position/height formulas are easy to reason about
// (and change) without touching JSX.

export const HOUR_HEIGHT_PX = 60;
export const GRID_HEIGHT_PX = HOUR_HEIGHT_PX * 24;
export const MIN_EVENT_HEIGHT_PX = 22;

export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// Vertical offset for a given moment within its day, per the grid's
// (hour * hourHeight) + (minute/60 * hourHeight) formula.
export function topPxForTime(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  return hours * HOUR_HEIGHT_PX;
}

export function heightPxForRange(startIso: string, endIso?: string): number {
  if (!endIso) return MIN_EVENT_HEIGHT_PX;
  const minutes = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  return Math.max((minutes / 60) * HOUR_HEIGHT_PX, MIN_EVENT_HEIGHT_PX);
}

// Reverse of topPxForTime: given a Y offset within the grid, what time of
// day does that correspond to (snapped to the nearest half hour)? Used for
// click-to-create in the hourly grid.
export function timeForTopPx(px: number): { hours: number; minutes: number } {
  const totalMinutes = (px / HOUR_HEIGHT_PX) * 60;
  const snapped = Math.round(totalMinutes / 30) * 30;
  const clamped = Math.min(Math.max(snapped, 0), 23 * 60 + 30);
  return { hours: Math.floor(clamped / 60), minutes: clamped % 60 };
}
