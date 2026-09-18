import { WEEKDAY_SHORT_LABELS } from './recurrence';

interface WeekdayToggleProps {
  selected: number[]; // 0=Sun..6=Sat
  onChange: (next: number[]) => void;
}

export function WeekdayToggle({ selected, onChange }: WeekdayToggleProps) {
  function toggle(day: number) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day].sort((a, b) => a - b));
    }
  }

  return (
    <div className="flex gap-1.5">
      {WEEKDAY_SHORT_LABELS.map((label, day) => {
        const isSelected = selected.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
