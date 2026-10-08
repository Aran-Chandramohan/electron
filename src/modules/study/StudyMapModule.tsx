import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ClassTable } from './ClassTable';
import { PlusIcon } from '../../components/icons/Icons';

export function StudyMapModule() {
  const studyClasses = useAppStore((s) => s.studyClasses);
  const addStudyClass = useAppStore((s) => s.addStudyClass);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const classList = Object.values(studyClasses).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function handleAdd() {
    addStudyClass(newName.trim() || 'New Class');
    setNewName('');
    setAdding(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Study Map</h1>
          <p className="text-sm text-neutral-400">
            {classList.length} class{classList.length === 1 ? '' : 'es'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-neutral-950 shadow-sm hover:bg-accent-500"
        >
          <PlusIcon className="h-4 w-4" />
          Add Class
        </button>
      </div>

      {adding && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Class or subject name"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          />
          <button
            onClick={handleAdd}
            className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-accent-500"
          >
            Create
          </button>
          <button
            onClick={() => setAdding(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-4">
        {classList.length === 0 && !adding ? (
          <div className="rounded-xl border border-dashed border-neutral-700 py-12 text-center text-sm text-neutral-500">
            No classes yet. Click "Add Class" to create your first table.
          </div>
        ) : (
          classList.map((studyClass) => <ClassTable key={studyClass.id} studyClass={studyClass} />)
        )}
      </div>
    </div>
  );
}
