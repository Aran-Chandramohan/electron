import { WEEKDAY_NAMES } from './recurrence';

export type RepeatMode = 'none' | 'daily' | 'weekly' | 'custom';

interface RepeatSelectProps {
  mode: RepeatMode;
  eventDate: Date;
  onChange: (mode: RepeatMode) => void;
}

// The default, one-click repeat picker. Only "Custom" reveals the detailed
// frequency/interval/weekday/end-date editor (CustomRecurrenceModal) —
// progressive disclosure so most users never see that complexity.
export function RepeatSelect({ mode, eventDate, onChange }: RepeatSelectProps) {
  const weekdayName = WEEKDAY_NAMES[eventDate.getDay()];

  return (
    <select
      value={mode}
      onChange={(e) => onChange(e.target.value as RepeatMode)}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      <option value="none">Does not repeat</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly on {weekdayName}</option>
      <option value="custom">Custom</option>
    </select>
  );
}
