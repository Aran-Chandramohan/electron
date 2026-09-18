import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { colorClassesFor, nextPaletteColor } from './tagColors';
import { PlusIcon, XIcon } from '../icons/Icons';

interface CategoryFilterProps {
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
}

// Generic tag filter bar — used by any module that wants to filter its
// items by category (To-Do tasks today, Calendar events, etc.). Tags are a
// single shared list, so a category created in one module shows up in all.
export function CategoryFilter({ selectedTagId, onSelect }: CategoryFilterProps) {
  const tags = useAppStore((s) => s.tags);
  const addTag = useAppStore((s) => s.addTag);
  const deleteTag = useAppStore((s) => s.deleteTag);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const tagList = Object.values(tags);

  function handleAdd() {
    const trimmed = newName.trim();
    if (trimmed) {
      addTag(trimmed, nextPaletteColor(tagList.length));
    }
    setNewName('');
    setAdding(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          selectedTagId === null
            ? 'bg-blue-600 text-white'
            : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700'
        }`}
      >
        All
      </button>

      {tagList.map((tag) => {
        const colors = colorClassesFor(tag.color);
        const isSelected = selectedTagId === tag.id;
        return (
          <div key={tag.id} className="group relative">
            <button
              onClick={() => onSelect(tag.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isSelected ? `ring-2 ${colors.ring} ${colors.chip}` : `${colors.chip} hover:brightness-95`
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              {tag.name}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected) onSelect(null);
                deleteTag(tag.id);
              }}
              className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-slate-600 text-white group-hover:flex"
              title={`Delete "${tag.name}" category`}
            >
              <XIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        );
      })}

      {adding ? (
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleAdd}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
            if (e.key === 'Escape') {
              setNewName('');
              setAdding(false);
            }
          }}
          placeholder="Category name"
          className="w-32 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-500"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Category
        </button>
      )}
    </div>
  );
}
