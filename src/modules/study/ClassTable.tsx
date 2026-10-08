import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { StudyClass, StudyTableCellStyle } from '../../types/schema';
import { ChevronDownIcon, TrashIcon } from '../../components/icons/Icons';
import { CellFormatToolbar } from './CellFormatToolbar';

interface ClassTableProps {
  studyClass: StudyClass;
}

export function ClassTable({ studyClass }: ClassTableProps) {
  const updateStudyClass = useAppStore((s) => s.updateStudyClass);
  const deleteStudyClass = useAppStore((s) => s.deleteStudyClass);
  const addStudyClassRow = useAppStore((s) => s.addStudyClassRow);
  const removeStudyClassRow = useAppStore((s) => s.removeStudyClassRow);
  const addStudyClassColumn = useAppStore((s) => s.addStudyClassColumn);
  const removeStudyClassColumn = useAppStore((s) => s.removeStudyClassColumn);
  const updateStudyClassCell = useAppStore((s) => s.updateStudyClassCell);

  const [titleDraft, setTitleDraft] = useState(studyClass.name);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const selectedCell = selected ? studyClass.rows[selected.r]?.[selected.c] ?? null : null;
  const colCount = studyClass.rows[0]?.length ?? 0;

  function commitTitle() {
    const trimmed = titleDraft.trim();
    updateStudyClass(studyClass.id, { name: trimmed || 'Untitled Class' });
    if (!trimmed) setTitleDraft('Untitled Class');
  }

  function handleFormatChange(changes: Partial<StudyTableCellStyle>) {
    if (!selected) return;
    updateStudyClassCell(studyClass.id, selected.r, selected.c, changes);
  }

  function handleDeleteClass() {
    if (confirm(`Delete "${studyClass.name}"? This can't be undone.`)) {
      deleteStudyClass(studyClass.id);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => updateStudyClass(studyClass.id, { collapsed: !studyClass.collapsed })}
            className="flex-shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-800"
            title={studyClass.collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${studyClass.collapsed ? '-rotate-90' : ''}`} />
          </button>
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="w-full min-w-0 rounded bg-transparent px-1 py-0.5 text-base font-semibold text-neutral-100 outline-none focus:bg-neutral-800"
          />
        </div>
        <button
          onClick={handleDeleteClass}
          className="flex-shrink-0 rounded-lg p-1.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
          title="Delete class"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {!studyClass.collapsed && (
        <div className="border-t border-neutral-800 p-3">
          <CellFormatToolbar cell={selectedCell} onChange={handleFormatChange} />

          <div className="overflow-x-auto">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-6" />
                  {Array.from({ length: colCount }).map((_, c) => (
                    <th key={c} className="px-0.5 pb-1 text-center">
                      <button
                        onClick={() => removeStudyClassColumn(studyClass.id, c)}
                        className="flex h-5 w-5 items-center justify-center rounded text-xs text-neutral-600 hover:bg-red-500/10 hover:text-red-400"
                        title="Remove column"
                      >
                        ×
                      </button>
                    </th>
                  ))}
                  <th className="pb-1">
                    <button
                      onClick={() => addStudyClassColumn(studyClass.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-xs text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                      title="Add column"
                    >
                      +
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {studyClass.rows.map((row, r) => (
                  <tr key={r}>
                    <td className="pr-0.5">
                      <button
                        onClick={() => removeStudyClassRow(studyClass.id, r)}
                        className="flex h-5 w-5 items-center justify-center rounded text-xs text-neutral-600 hover:bg-red-500/10 hover:text-red-400"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                    {row.map((cell, c) => (
                      <td key={c} className="border border-neutral-800 p-0">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => setSelected({ r, c })}
                          onBlur={(e) =>
                            updateStudyClassCell(studyClass.id, r, c, { value: e.currentTarget.innerText })
                          }
                          style={{
                            fontWeight: cell.bold ? 700 : 400,
                            fontStyle: cell.italic ? 'italic' : 'normal',
                            textDecoration: cell.underline ? 'underline' : 'none',
                            fontSize: cell.fontSize ? `${cell.fontSize}px` : undefined,
                            fontFamily: cell.fontFamily || undefined,
                            color: cell.textColor || undefined,
                            backgroundColor: cell.fillColor || undefined,
                          }}
                          className="min-h-[2rem] min-w-[7rem] whitespace-pre-wrap break-words px-2 py-1.5 text-neutral-200 outline-none focus:ring-1 focus:ring-inset focus:ring-accent-500"
                        >
                          {cell.value}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => addStudyClassRow(studyClass.id)}
            className="mt-2 rounded-lg border border-dashed border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-800"
          >
            + Row
          </button>
        </div>
      )}
    </div>
  );
}
