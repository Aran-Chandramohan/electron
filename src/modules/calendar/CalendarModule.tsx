import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Task } from '../../types/schema';
import { CalendarLegend } from './CalendarLegend';
import { DayCell, type EventDragPayload } from './DayCell';
import { TimeGridView } from './TimeGridView';
import { TodoToggle } from './TodoToggle';
import { EventForm } from './EventForm';
import { expandEventsForRange, type EventOccurrence } from './recurrence';
import {
  WEEKDAY_LABELS,
  formatFullDate,
  formatMonthYear,
  formatWeekRange,
  getMonthGrid,
  getWeekDays,
  isSameDay,
  toDateKey,
  UNCATEGORIZED_ID,
} from './calendarUtils';

type ViewMode = 'day' | 'week' | 'month';
const VIEW_MODES: ViewMode[] = ['day', 'week', 'month'];

export function CalendarModule() {
  const events = useAppStore((s) => s.events);
  const tasks = useAppStore((s) => s.tasks);
  const updateEventOccurrence = useAppStore((s) => s.updateEventOccurrence);
  const toggleTaskStatus = useAppStore((s) => s.toggleTaskStatus);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [viewedDate, setViewedDate] = useState(new Date());
  const [hiddenTagIds, setHiddenTagIds] = useState<Set<string>>(new Set());
  const [showTodos, setShowTodos] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<EventOccurrence | null>(null);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  const today = new Date();

  const gridDays = useMemo(() => {
    if (viewMode === 'month') return getMonthGrid(viewedDate.getFullYear(), viewedDate.getMonth());
    if (viewMode === 'week') return getWeekDays(viewedDate);
    return [viewedDate];
  }, [viewMode, viewedDate]);

  const isTagVisible = (tagId: string | undefined) => (tagId ? !hiddenTagIds.has(tagId) : !hiddenTagIds.has(UNCATEGORIZED_ID));

  // Recurring events are expanded into occurrences only across the range the
  // active view actually shows — never materialized as stored rows.
  const occurrencesByDay = useMemo(() => {
    const rangeStart = new Date(gridDays[0].getFullYear(), gridDays[0].getMonth(), gridDays[0].getDate());
    const lastDay = gridDays[gridDays.length - 1];
    const rangeEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999);

    const map = new Map<string, EventOccurrence[]>();
    expandEventsForRange(events, rangeStart, rangeEnd)
      .filter((occurrence) => isTagVisible(occurrence.event.tagIds[0]))
      .forEach((occurrence) => {
        const key = toDateKey(new Date(occurrence.event.start));
        const list = map.get(key) ?? [];
        list.push(occurrence);
        map.set(key, list);
      });
    for (const list of map.values()) {
      list.sort((a, b) => a.event.start.localeCompare(b.event.start));
    }
    return map;
  }, [events, hiddenTagIds, gridDays]);

  // To-Do items due on a given day, grouped the same way as events so the
  // "To Do" toggle can swap one for the other in the same cells.
  const todosByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    Object.values(tasks)
      .filter((task) => !task.archived && task.dueDate && isTagVisible(task.tagIds[0]))
      .forEach((task) => {
        const key = toDateKey(new Date(task.dueDate!));
        const list = map.get(key) ?? [];
        list.push(task);
        map.set(key, list);
      });
    for (const list of map.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [tasks, hiddenTagIds]);

  function toggleTagVisibility(tagId: string) {
    setHiddenTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function goToToday() {
    setViewedDate(new Date());
  }

  function step(direction: 1 | -1) {
    setViewedDate((prev) => {
      if (viewMode === 'month') return new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * (viewMode === 'week' ? 7 : 1));
      return next;
    });
  }

  function openNewEventForm(date: Date) {
    setEditingOccurrence(null);
    setNewEventDate(date);
    setFormOpen(true);
  }

  function openEditForm(occurrence: EventOccurrence) {
    setEditingOccurrence(occurrence);
    setNewEventDate(null);
    setFormOpen(true);
  }

  // Dropping an occurrence onto a different day moves just that occurrence
  // (an exception), keeping its time-of-day and duration — dragging never
  // touches the rest of the series.
  function handleEventDrop(payload: EventDragPayload, newDate: Date) {
    const currentStart = new Date(payload.currentStart);
    const newStart = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), currentStart.getHours(), currentStart.getMinutes(), currentStart.getSeconds());
    const durationMs = payload.currentEnd ? new Date(payload.currentEnd).getTime() - currentStart.getTime() : 0;
    const newEnd = durationMs > 0 ? new Date(newStart.getTime() + durationMs) : undefined;

    updateEventOccurrence(
      payload.masterId,
      payload.originalStart,
      { start: newStart.toISOString(), end: newEnd?.toISOString() },
      'this'
    );
  }

  const headerTitle =
    viewMode === 'month'
      ? formatMonthYear(viewedDate)
      : viewMode === 'week'
        ? formatWeekRange(getWeekDays(viewedDate))
        : formatFullDate(viewedDate);

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-100">{headerTitle}</h1>
        <div className="flex items-center gap-2">
          <TodoToggle checked={showTodos} onChange={setShowTodos} />

          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => step(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800"
              aria-label={`Previous ${viewMode}`}
            >
              &lt;
            </button>
            <button
              onClick={() => step(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800"
              aria-label={`Next ${viewMode}`}
            >
              &gt;
            </button>
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-900 p-1 text-sm font-medium">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 capitalize transition ${
                  viewMode === mode ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => openNewEventForm(new Date())}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500"
          >
            + New Event
          </button>
        </div>
      </div>

      <div className="mb-4">
        <CalendarLegend hiddenTagIds={hiddenTagIds} onToggle={toggleTagVisibility} />
      </div>

      {viewMode === 'month' ? (
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/80 text-center text-xs font-semibold text-slate-500">
            {gridDays.slice(0, 7).map((d) => (
              <div key={d.toISOString()} className="py-2">
                {WEEKDAY_LABELS[d.getDay()]}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {gridDays.map((date) => (
              <DayCell
                key={date.toISOString()}
                date={date}
                isCurrentMonth={date.getMonth() === viewedDate.getMonth()}
                isToday={isSameDay(date, today)}
                occurrences={occurrencesByDay.get(toDateKey(date)) ?? []}
                onDayClick={openNewEventForm}
                onEventClick={openEditForm}
                onEventDrop={handleEventDrop}
                maxVisibleEvents={3}
                showTodos={showTodos}
                todos={todosByDay.get(toDateKey(date)) ?? []}
                onTodoClick={(task) => toggleTaskStatus(task.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <TimeGridView
          days={gridDays}
          today={today}
          occurrencesByDay={occurrencesByDay}
          todosByDay={todosByDay}
          showTodos={showTodos}
          onEventClick={openEditForm}
          onTodoClick={(task) => toggleTaskStatus(task.id)}
          onCreateEvent={openNewEventForm}
        />
      )}

      {formOpen && (
        <EventForm editingOccurrence={editingOccurrence} defaultDate={newEventDate} onClose={() => setFormOpen(false)} />
      )}
    </div>
  );
}
