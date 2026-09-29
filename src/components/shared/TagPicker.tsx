import { useAppStore } from '../../store/useAppStore';
import { colorClassesFor } from './tagColors';

interface TagPickerProps {
  selectedTagId: string;
  onChange: (tagId: string) => void;
}

export function TagPicker({ selectedTagId, onChange }: TagPickerProps) {
  const tags = useAppStore((s) => s.tags);
  const tagList = Object.values(tags);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
          selectedTagId === '' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        }`}
      >
        None
      </button>
      {tagList.map((tag) => {
        const colors = colorClassesFor(tag.color);
        const isSelected = selectedTagId === tag.id;
        return (
          <button
            type="button"
            key={tag.id}
            onClick={() => onChange(tag.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${
              isSelected ? `ring-2 ${colors.ring}${colors.chip}` : `${colors.chip} hover:brightness-95`
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
