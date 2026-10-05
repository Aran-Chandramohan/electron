export type RecurrenceScope = 'this' | 'following' | 'all';

interface EditScopeDialogProps {
  verb: 'Save' | 'Delete';
  onChoose: (scope: RecurrenceScope) => void;
  onCancel: () => void;
}

const OPTIONS: { value: RecurrenceScope; label: string }[] = [
  { value: 'this', label: 'This event' },
  { value: 'following', label: 'This and following events' },
  { value: 'all', label: 'All events in the series' },
];

// Shown before committing an edit or delete to a recurring occurrence, same
// three-way choice Google Calendar offers.
export function EditScopeDialog({ verb, onChoose, onCancel }: EditScopeDialogProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-xs rounded-2xl bg-neutral-900 p-6 shadow-xl ring-1 ring-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-neutral-100">{verb} recurring event</h2>
        <div className="space-y-1">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onChoose(option.value)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
