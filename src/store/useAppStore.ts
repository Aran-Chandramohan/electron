import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Task, Tag, Event, RecurrenceRule, ID } from '../types/schema';
import { splitRecurrenceSeries } from '../modules/calendar/recurrence';

function newId(): ID {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

interface AppActions {
  // ---- Task CRUD (Module 1: To-Do List) ----
  addTask: (input: {
    title: string;
    description?: string;
    priority: Task['priority'];
    dueDate?: string;
    tagIds: ID[];
  }) => ID;
  updateTask: (id: ID, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  toggleTaskStatus: (id: ID) => void;
  deleteTask: (id: ID) => void;

  // ---- Event CRUD (Module 2: Calendar) ----
  addEvent: (input: {
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
    location?: string;
    tagIds: ID[];
    recurrence?: RecurrenceRule;
  }) => ID;
  updateEvent: (id: ID, changes: Partial<Omit<Event, 'id' | 'createdAt'>>) => void;
  deleteEvent: (id: ID) => void;

  // ---- Occurrence-aware editing for recurring events. `masterId` is the
  // series' event id; `originalStart` identifies which generated occurrence
  // is being acted on (see EventOccurrence in recurrence.ts). Both no-op
  // into a plain updateEvent/deleteEvent when the target isn't recurring. ----
  updateEventOccurrence: (
    masterId: ID,
    originalStart: string,
    changes: Partial<Omit<Event, 'id' | 'createdAt'>>,
    scope: 'this' | 'following' | 'all'
  ) => void;
  deleteEventOccurrence: (masterId: ID, originalStart: string, scope: 'this' | 'following' | 'all') => void;

  // ---- Tag CRUD (used as "categories" by the To-Do module, event colors
  // by the Calendar module, and by every future module for cross-cutting
  // labeling) ----
  addTag: (name: string, color: string) => ID;
  deleteTag: (id: ID) => void;
}

export type AppStore = AppState & AppActions;

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-academic', name: 'Academic', color: 'blue' },
  { id: 'tag-personal', name: 'Personal', color: 'emerald' },
];

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      tasks: {},
      projects: {},
      jobs: {},
      events: {},
      researchNotes: {},
      tags: Object.fromEntries(DEFAULT_TAGS.map((t) => [t.id, t])),
      relations: {},

      addTask: (input) => {
        const id = newId();
        const timestamp = now();
        const task: Task = {
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          archived: false,
          tagIds: input.tagIds,
          title: input.title,
          description: input.description,
          status: 'todo',
          priority: input.priority,
          dueDate: input.dueDate,
          subtaskIds: [],
        };
        set((state) => ({ tasks: { ...state.tasks, [id]: task } }));
        return id;
      },

      updateTask: (id, changes) => {
        set((state) => {
          const existing = state.tasks[id];
          if (!existing) return state;
          return {
            tasks: {
              ...state.tasks,
              [id]: { ...existing, ...changes, updatedAt: now() },
            },
          };
        });
      },

      toggleTaskStatus: (id) => {
        set((state) => {
          const existing = state.tasks[id];
          if (!existing) return state;
          const isDone = existing.status === 'done';
          return {
            tasks: {
              ...state.tasks,
              [id]: {
                ...existing,
                status: isDone ? 'todo' : 'done',
                completedAt: isDone ? undefined : now(),
                updatedAt: now(),
              },
            },
          };
        });
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: Object.fromEntries(
            Object.entries(state.tasks).filter(([taskId]) => taskId !== id)
          ),
        }));
      },

      addEvent: (input) => {
        const id = newId();
        const timestamp = now();
        const event: Event = {
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          archived: false,
          tagIds: input.tagIds,
          title: input.title,
          start: input.start,
          end: input.end,
          allDay: input.allDay,
          location: input.location,
          recurrence: input.recurrence,
        };
        set((state) => ({ events: { ...state.events, [id]: event } }));
        return id;
      },

      updateEvent: (id, changes) => {
        set((state) => {
          const existing = state.events[id];
          if (!existing) return state;
          return {
            events: {
              ...state.events,
              [id]: { ...existing, ...changes, updatedAt: now() },
            },
          };
        });
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: Object.fromEntries(
            Object.entries(state.events).filter(([eventId]) => eventId !== id)
          ),
        }));
      },

      updateEventOccurrence: (masterId, originalStart, changes, scope) => {
        set((state) => {
          const master = state.events[masterId];
          if (!master) return state;

          if (!master.recurrence || scope === 'all') {
            return {
              events: { ...state.events, [masterId]: { ...master, ...changes, updatedAt: now() } },
            };
          }

          const timestamp = now();

          if (scope === 'this') {
            const existingOverride = Object.values(state.events).find(
              (e) => e.recurrenceId === masterId && e.originalStart === originalStart
            );
            const overrideId = existingOverride?.id ?? newId();
            const overrideEvent: Event = {
              ...master,
              ...changes,
              id: overrideId,
              createdAt: existingOverride?.createdAt ?? timestamp,
              updatedAt: timestamp,
              recurrence: undefined,
              excludedDates: undefined,
              recurrenceId: masterId,
              originalStart,
            };
            return { events: { ...state.events, [overrideId]: overrideEvent } };
          }

          // scope === 'following': split the series at originalStart. Everything
          // before keeps the old master id unchanged; the edited occurrence and
          // everything after become a new series so earlier occurrences are
          // untouched (per-model, this is an edit, not a destructive rewrite).
          const dtstart = new Date(master.start);
          const splitPoint = new Date(originalStart);
          const { beforeRule, afterRule } = splitRecurrenceSeries(master.recurrence, dtstart, splitPoint);
          const newSeriesId = newId();

          const repointed = Object.fromEntries(
            Object.entries(state.events).map(([id, e]) => {
              if (e.recurrenceId === masterId && e.originalStart && e.originalStart >= originalStart) {
                return [id, { ...e, recurrenceId: newSeriesId }];
              }
              return [id, e];
            })
          );

          const truncatedMaster: Event = {
            ...master,
            recurrence: beforeRule,
            excludedDates: (master.excludedDates ?? []).filter((d) => d < originalStart),
            updatedAt: timestamp,
          };

          const newMaster: Event = {
            ...master,
            ...changes,
            id: newSeriesId,
            start: changes.start ?? originalStart,
            recurrence: changes.recurrence ?? afterRule,
            excludedDates: (master.excludedDates ?? []).filter((d) => d >= originalStart),
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          return {
            events: { ...repointed, [masterId]: truncatedMaster, [newSeriesId]: newMaster },
          };
        });
      },

      deleteEventOccurrence: (masterId, originalStart, scope) => {
        set((state) => {
          const master = state.events[masterId];
          if (!master) return state;

          if (!master.recurrence) {
            return {
              events: Object.fromEntries(Object.entries(state.events).filter(([id]) => id !== masterId)),
            };
          }

          if (scope === 'all') {
            return {
              events: Object.fromEntries(
                Object.entries(state.events).filter(([id, e]) => id !== masterId && e.recurrenceId !== masterId)
              ),
            };
          }

          if (scope === 'this') {
            const events = Object.fromEntries(
              Object.entries(state.events).filter(
                ([, e]) => !(e.recurrenceId === masterId && e.originalStart === originalStart)
              )
            );
            events[masterId] = {
              ...master,
              excludedDates: [...(master.excludedDates ?? []), originalStart],
              updatedAt: now(),
            };
            return { events };
          }

          // scope === 'following'
          const dtstart = new Date(master.start);
          const splitPoint = new Date(originalStart);
          const { beforeRule } = splitRecurrenceSeries(master.recurrence, dtstart, splitPoint);
          const events = Object.fromEntries(
            Object.entries(state.events).filter(
              ([id, e]) => !(id !== masterId && e.recurrenceId === masterId && e.originalStart && e.originalStart >= originalStart)
            )
          );
          events[masterId] = {
            ...master,
            recurrence: beforeRule,
            excludedDates: (master.excludedDates ?? []).filter((d) => d < originalStart),
            updatedAt: now(),
          };
          return { events };
        });
      },

      addTag: (name, color) => {
        const id = newId();
        const tag: Tag = { id, name, color };
        set((state) => ({ tags: { ...state.tags, [id]: tag } }));
        return id;
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: Object.fromEntries(
            Object.entries(state.tags).filter(([tagId]) => tagId !== id)
          ),
          // Detach the tag from any tasks/events that referenced it.
          tasks: Object.fromEntries(
            Object.entries(state.tasks).map(([taskId, task]) => [
              taskId,
              { ...task, tagIds: task.tagIds.filter((t) => t !== id) },
            ])
          ),
          events: Object.fromEntries(
            Object.entries(state.events).map(([eventId, event]) => [
              eventId,
              { ...event, tagIds: event.tagIds.filter((t) => t !== id) },
            ])
          ),
        }));
      },
    }),
    { name: 'productivity-app-storage' }
  )
);
