import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types/schema';
import { colorClassesFor, solidColorClassFor } from '../../components/shared/tagColors';
import { RepeatIcon } from '../../components/icons/Icons';
import type { EventOccurrence } from './recurrence';

export interface EventDragPayload {
  masterId: string;
  originalStart: string;
  currentStart: string;
  currentEnd?: string;
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  occurrences: EventOccurrence[];
  onDayClick: (date: Date) => void;
  onEventClick: (occurrence: EventOccurrence) => void;
  onEventDrop?: (payload: EventDragPayload, newDate: Date) => void;
  maxVisibleEvents?: number;
  minHeightClassName?: string;
  // When set, the cell shows these To-Do items (color-coded by category)
  // instead of event occurrences entirely.
  showTodos?: boolean;
  todos?: Task[];
  onTodoClick?: (task: Task) => void;
}

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  occurrences,
  onDayClick,
  onEventClick,
  onEventDrop,
  maxVisibleEvents = 3,
  minHeightClassName = 'min-h-[96px]',
  showTodos = false,
  todos = [],
  onTodoClick,
}: DayCellProps) {
  const tags = useAppStore((s) => s.tags);

  const visibleEvents = occurrences.slice(0, maxVisibleEvents);
  const eventOverflowCount = occurrences.length - visibleEvents.length;
  const visibleTodos = todos.slice(0, maxVisibleEvents);
  const todoOverflowCount = todos.length - visibleTodos.length;

  return (
    <button
      onClick={() => onDayClick(date)}
      onDragOver={(e) => {
        if (onEventDrop && !showTodos) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!onEventDrop || showTodos) return;
        e.preventDefault();
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return;
        onEventDrop(JSON.parse(raw) as EventDragPayload, date);
      }}
      className={`flex ${minHeightClassName} flex-col gap-1 border-b border-r border-slate-800 p-1.5 text-left transition hover:bg-slate-800/50 ${
        isCurrentMonth ? 'bg-slate-900' : 'bg-slate-900/40'
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
          isToday
            ? 'bg-blue-600 text-white'
            : isCurrentMonth
              ? 'text-slate-300'
              : 'text-slate-600'
        }`}
      >
        {date.getDate()}
      </span>

      <div className="flex flex-col gap-1">
        {showTodos
          ? visibleTodos.map((task) => {
              const tag = task.tagIds[0] ? tags[task.tagIds[0]] : undefined;
              const colors = colorClassesFor(tag?.color ?? 'slate');
              return (
                <span
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTodoClick?.(task);
                  }}
                  className={`truncate rounded px-1.5 py-0.5 text-left text-xs font-medium ${colors.chip} ${
                    task.status === 'done' ? 'line-through opacity-60' : ''
                  }`}
                  title={task.title}
                >
                  {task.title}
                </span>
              );
            })
          : visibleEvents.map((occurrence) => {
              const { event } = occurrence;
              const tag = event.tagIds[0] ? tags[event.tagIds[0]] : undefined;
              const solid = solidColorClassFor(tag?.color ?? 'blue');
              return (
                <span
                  key={`${occurrence.masterId}:${occurrence.originalStart}`}
                  draggable={Boolean(onEventDrop)}
                  onDragStart={(e) => {
                    const payload: EventDragPayload = {
                      masterId: occurrence.masterId,
                      originalStart: occurrence.originalStart,
                      currentStart: event.start,
                      currentEnd: event.end,
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(payload));
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(occurrence);
                  }}
                  className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white ${solid}`}
                  title={event.title}
                >
                  {occurrence.isRecurring && <RepeatIcon className="h-2.5 w-2.5 flex-shrink-0" />}
                  <span className="truncate">
                    {event.allDay ? '' : `${new Date(event.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} `}
                    {event.title}
                  </span>
                </span>
              );
            })}
        {showTodos
          ? todoOverflowCount > 0 && <span className="px-1.5 text-xs font-medium text-slate-500">+{todoOverflowCount} more</span>
          : eventOverflowCount > 0 && <span className="px-1.5 text-xs font-medium text-slate-500">+{eventOverflowCount} more</span>}
      </div>
    </button>
  );
}
