import { useEffect, useRef, type MouseEvent } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types/schema';
import { colorClassesFor, solidColorClassFor } from '../../components/shared/tagColors';
import { RepeatIcon } from '../../components/icons/Icons';
import type { EventOccurrence } from './recurrence';
import { isSameDay, toDateKey, WEEKDAY_LABELS } from './calendarUtils';
import { GRID_HEIGHT_PX, HOUR_HEIGHT_PX, HOURS, formatHourLabel, heightPxForRange, timeForTopPx, topPxForTime } from './timeGrid';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

interface TimeGridViewProps {
  days: Date[]; // length 1 for Day view, 7 for Week view
  today: Date;
  occurrencesByDay: Map<string, EventOccurrence[]>;
  todosByDay: Map<string, Task[]>;
  showTodos: boolean;
  onEventClick: (occurrence: EventOccurrence) => void;
  onTodoClick: (task: Task) => void;
  onCreateEvent: (date: Date) => void;
}

export function TimeGridView({
  days,
  today,
  occurrencesByDay,
  todosByDay,
  showTodos,
  onEventClick,
  onTodoClick,
  onCreateEvent,
}: TimeGridViewProps) {
  const tags = useAppStore((s) => s.tags);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll so "now" is centered when this view first mounts (e.g. when
  // switching into Day/Week) — not on every re-render/navigation.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const target = topPxForTime(new Date()) - container.clientHeight / 2;
    container.scrollTop = Math.max(0, Math.min(target, GRID_HEIGHT_PX - container.clientHeight));
  }, []);

  function colorsFor(tagId?: string) {
    const tag = tagId ? tags[tagId] : undefined;
    return { chip: colorClassesFor(tag?.color ?? 'blue').chip, solid: solidColorClassFor(tag?.color ?? 'blue') };
  }

  function handleGridClick(day: Date, e: MouseEvent<HTMLDivElement>) {
    if (showTodos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { hours, minutes } = timeForTopPx(e.clientY - rect.top);
    onCreateEvent(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes));
  }

  const showHeader = days.length > 1;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
      {showHeader && (
        <div className="flex border-b border-slate-800 bg-slate-900/80 text-center text-xs font-semibold text-slate-500">
          <div className="w-14 flex-shrink-0" />
          {days.map((day) => (
            <div key={day.toISOString()} className="flex-1 py-2">
              {WEEKDAY_LABELS[day.getDay()]}{' '}
              <span className={isSameDay(day, today) ? 'text-blue-400' : 'text-slate-300'}>{day.getDate()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex border-b border-slate-800">
        <div className="flex w-14 flex-shrink-0 items-center justify-center py-1 text-[10px] font-medium text-slate-600">
          {showTodos ? 'To-Do' : 'All day'}
        </div>
        {days.map((day) => {
          const dateKey = toDateKey(day);
          return (
            <div key={day.toISOString()} className="flex-1 space-y-1 border-l border-slate-800 p-1">
              {showTodos
                ? (todosByDay.get(dateKey) ?? []).map((task) => {
                    const colors = colorsFor(task.tagIds[0]);
                    return (
                      <button
                        key={task.id}
                        onClick={() => onTodoClick(task)}
                        title={task.title}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium ${colors.chip} ${
                          task.status === 'done' ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {task.title}
                      </button>
                    );
                  })
                : (occurrencesByDay.get(dateKey) ?? [])
                    .filter((o) => o.event.allDay)
                    .map((occurrence) => {
                      const colors = colorsFor(occurrence.event.tagIds[0]);
                      return (
                        <button
                          key={`${occurrence.masterId}:${occurrence.originalStart}`}
                          onClick={() => onEventClick(occurrence)}
                          title={occurrence.event.title}
                          className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white ${colors.solid}`}
                        >
                          {occurrence.event.title}
                        </button>
                      );
                    })}
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex flex-1 overflow-y-auto">
        <div className="w-14 flex-shrink-0">
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT_PX }}
              className="border-b border-slate-800 pr-2 text-right text-[10px] text-slate-600"
            >
              {hour !== 0 && formatHourLabel(hour)}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dateKey = toDateKey(day);
          const timedOccurrences = showTodos
            ? []
            : (occurrencesByDay.get(dateKey) ?? []).filter((o) => !o.event.allDay);

          return (
            <div
              key={day.toISOString()}
              className="relative flex-1 border-l border-slate-800"
              style={{ height: GRID_HEIGHT_PX }}
              onClick={(e) => handleGridClick(day, e)}
            >
              {HOURS.map((hour) => (
                <div key={hour} style={{ height: HOUR_HEIGHT_PX }} className="border-b border-slate-800" />
              ))}

              {timedOccurrences.map((occurrence) => {
                const colors = colorsFor(occurrence.event.tagIds[0]);
                return (
                  <button
                    key={`${occurrence.masterId}:${occurrence.originalStart}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(occurrence);
                    }}
                    style={{
                      top: topPxForTime(new Date(occurrence.event.start)),
                      height: heightPxForRange(occurrence.event.start, occurrence.event.end),
                    }}
                    title={occurrence.event.title}
                    className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded px-1.5 py-0.5 text-left text-xs font-medium text-white ${colors.solid}`}
                  >
                    {occurrence.isRecurring && <RepeatIcon className="mr-1 inline h-2.5 w-2.5" />}
                    {occurrence.event.title}
                  </button>
                );
              })}

              {isSameDay(day, today) && <CurrentTimeIndicator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
