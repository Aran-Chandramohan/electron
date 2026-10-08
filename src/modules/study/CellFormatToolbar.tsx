import type { StudyTableCell, StudyTableCellStyle } from '../../types/schema';

interface CellFormatToolbarProps {
  cell: StudyTableCell | null;
  onChange: (changes: Partial<StudyTableCellStyle>) => void;
}

const FONT_OPTIONS = [
  { label: 'Sans', value: '' },
  { label: 'Serif', value: 'Georgia, Cambria, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
  { label: 'Comic', value: '"Comic Sans MS", cursive' },
];

const DEFAULT_TEXT_COLOR = '#e5e5e5';
const DEFAULT_FILL_COLOR = '#171717';

// A single-cell formatting bar — click a cell, then use this to set its
// bold/italic/underline, font, size, text color and fill color. Applies to
// whichever cell currently has focus (no multi-cell range selection).
export function CellFormatToolbar({ cell, onChange }: CellFormatToolbarProps) {
  const disabled = !cell;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ bold: !cell?.bold })}
        className={`flex h-7 w-7 items-center justify-center rounded text-sm font-bold transition disabled:opacity-40 ${
          cell?.bold ? 'bg-accent-600 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
        }`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ italic: !cell?.italic })}
        className={`flex h-7 w-7 items-center justify-center rounded text-sm italic transition disabled:opacity-40 ${
          cell?.italic ? 'bg-accent-600 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
        }`}
        title="Italic"
      >
        I
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ underline: !cell?.underline })}
        className={`flex h-7 w-7 items-center justify-center rounded text-sm underline transition disabled:opacity-40 ${
          cell?.underline ? 'bg-accent-600 text-neutral-950' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
        }`}
        title="Underline"
      >
        U
      </button>

      <div className="mx-1 h-5 w-px bg-neutral-700" />

      <select
        disabled={disabled}
        value={cell?.fontFamily ?? ''}
        onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
        title="Font"
        className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-xs text-neutral-200 outline-none focus:border-accent-500 disabled:opacity-40"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <input
        type="number"
        min={8}
        max={48}
        disabled={disabled}
        value={cell?.fontSize ?? 14}
        onChange={(e) => onChange({ fontSize: Number(e.target.value) || 14 })}
        title="Font size"
        className="w-14 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-xs text-neutral-200 outline-none focus:border-accent-500 disabled:opacity-40"
      />

      <div className="mx-1 h-5 w-px bg-neutral-700" />

      <label className="flex items-center gap-1 text-xs text-neutral-400" title="Text color">
        A
        <input
          type="color"
          disabled={disabled}
          value={cell?.textColor ?? DEFAULT_TEXT_COLOR}
          onChange={(e) => onChange({ textColor: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded border border-neutral-700 bg-neutral-800 disabled:opacity-40"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-neutral-400" title="Fill color">
        Fill
        <input
          type="color"
          disabled={disabled}
          value={cell?.fillColor ?? DEFAULT_FILL_COLOR}
          onChange={(e) => onChange({ fillColor: e.target.value })}
          className="h-6 w-6 cursor-pointer rounded border border-neutral-700 bg-neutral-800 disabled:opacity-40"
        />
      </label>
      {cell?.fillColor && (
        <button
          type="button"
          onClick={() => onChange({ fillColor: undefined })}
          className="text-xs font-medium text-neutral-500 hover:text-neutral-300"
        >
          Clear fill
        </button>
      )}
    </div>
  );
}
