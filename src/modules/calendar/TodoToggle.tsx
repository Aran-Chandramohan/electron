interface TodoToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// When on, the calendar shows To-Do items (color-coded by category) on
// their due date instead of events.
export function TodoToggle({ checked, onChange }: TodoToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
    >
      To Do
      <span
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
