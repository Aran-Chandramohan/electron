import { useAppStore } from '../../store/useAppStore';
import { colorClassesFor } from '../../components/shared/tagColors';
import { CheckIcon } from '../../components/icons/Icons';
import { UNCATEGORIZED_ID } from './calendarUtils';

interface CalendarLegendProps {
  hiddenTagIds: Set<string>;
  onToggle: (tagId: string) => void;
}

// Google-Calendar-style "my calendars" list: every category is independently
// shown/hidden (not a single-select filter like the To-Do module's
// CategoryFilter) — multiple categories can be visible at once.
export function CalendarLegend({ hiddenTagIds, onToggle }: CalendarLegendProps) {
  const tags = useAppStore((s) => s.tags);
  const tagList = Object.values(tags);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {tagList.map((tag) => {
        const colors = colorClassesFor(tag.color);
        const visible = !hiddenTagIds.has(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            className="flex items-center gap-1.5 text-sm font-medium transition"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded ${
                visible ? colors.dot : 'border border-black-600 bg-transparent'
              }`}
            >
              {visible && <CheckIcon className="h-3 w-3 text-white" />}
            </span>
            <span className={visible ? 'text-black-300' : 'text-black-500 line-through'}>{tag.name}</span>
          </button>
        );
      })}

      <button
        onClick={() => onToggle(UNCATEGORIZED_ID)}
        className="flex items-center gap-1.5 text-sm font-medium transition"
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded ${
            !hiddenTagIds.has(UNCATEGORIZED_ID) ? 'bg-black-500' : 'border border-black-600 bg-transparent'
          }`}
        >
          {!hiddenTagIds.has(UNCATEGORIZED_ID) && <CheckIcon className="h-3 w-3 text-white" />}
        </span>
        <span className={hiddenTagIds.has(UNCATEGORIZED_ID) ? 'text-black-500 line-through' : 'text-black-300'}>
          Uncategorized
        </span>
      </button>
    </div>
  );
}
