import { useState, type FormEvent } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { RecurrenceRule } from '../../types/schema';
import { TagPicker } from '../../components/shared/TagPicker';
import { XIcon } from '../../components/icons/Icons';
import type { EventOccurrence } from './recurrence';
import { classifyRecurrenceRule, describeRecurrenceRule } from './recurrence';
import { RepeatSelect, type RepeatMode } from './RepeatSelect';
import { CustomRecurrenceModal } from './CustomRecurrenceModal';
import { EditScopeDialog, type RecurrenceScope } from './EditScopeDialog';
import { AndroidTimePicker } from './Timepicker';

interface EventFormProps {
  editingOccurrence: EventOccurrence | null;
  defaultDate: Date | null;
  onClose: () => void;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface EventFormPayload {
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  tagIds: string[];
  recurrence?: RecurrenceRule;
}

export function EventForm({ editingOccurrence, defaultDate, onClose }: EventFormProps) {
  const events = useAppStore((s) => s.events);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const updateEventOccurrence = useAppStore((s) => s.updateEventOccurrence);
  const deleteEventOccurrence = useAppStore((s) => s.deleteEventOccurrence);

  const editingEvent = editingOccurrence?.event ?? null;
  const masterEvent = editingOccurrence ? events[editingOccurrence.masterId] : undefined;
  const isRecurring = editingOccurrence?.isRecurring ?? false;

  const initialDate = editingEvent ? new Date(editingEvent.start) : defaultDate ?? new Date();
  
  const hasExplicitTime = Boolean(defaultDate && (defaultDate.getHours() !== 0 || defaultDate.getMinutes() !== 0));
  const initialStartTime = editingEvent && !editingEvent.allDay
    ? toTimeInputValue(editingEvent.start)
    : hasExplicitTime
      ? `${String(defaultDate!.getHours()).padStart(2, '0')}:${String(defaultDate!.getMinutes()).padStart(2, '0')}`
      : '09:00';

  const [title, setTitle] = useState(editingEvent?.title ?? '');
  const [date, setDate] = useState(toDateInputValue(initialDate));
  const [allDay, setAllDay] = useState(editingEvent?.allDay ?? false);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(
    editingEvent?.end && !editingEvent.allDay ? toTimeInputValue(editingEvent.end) : addOneHour(initialStartTime)
  );
  const [location, setLocation] = useState(editingEvent?.location ?? '');
  const [tagId, setTagId] = useState<string>(editingEvent?.tagIds[0] ?? '');

  const [isStartClockOpen, setIsStartClockOpen] = useState(false);
  const [isEndClockOpen, setIsEndClockOpen] = useState(false);

  const masterDtstart = masterEvent ? new Date(masterEvent.start) : initialDate;
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() =>
    masterEvent?.recurrence ? classifyRecurrenceRule(masterEvent.recurrence, masterDtstart) : 'none'
  );
  const [customRule, setCustomRule] = useState<RecurrenceRule | null>(() =>
    masterEvent?.recurrence && classifyRecurrenceRule(masterEvent.recurrence, masterDtstart) === 'custom'
      ? masterEvent.recurrence
      : null
  );
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [scopeAction, setScopeAction] = useState<'save' | 'delete' | null>(null);
  const [pendingPayload, setPendingPayload] = useState<EventFormPayload | null>(null);

  const eventDateForRepeat = new Date(`${date}T00:00:00`);

  function handleRepeatModeChange(mode: RepeatMode) {
    setRepeatMode(mode);
    if (mode === 'custom') {
      if (!customRule) {
        setCustomRule({ freq: 'WEEKLY', interval: 1, byWeekday: [eventDateForRepeat.getDay()], timezone: TIMEZONE });
      }
      setCustomModalOpen(true);
    }
  }

  function buildRecurrenceForSave(): RecurrenceRule | undefined {
    if (repeatMode === 'none') return undefined;
    if (repeatMode === 'daily') return { freq: 'DAILY', interval: 1, timezone: TIMEZONE };
    if (repeatMode === 'weekly') {
      return { freq: 'WEEKLY', interval: 1, byWeekday: [eventDateForRepeat.getDay()], timezone: TIMEZONE };
    }
    return customRule ? { ...customRule, timezone: TIMEZONE } : undefined;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !date) return;

    const start = allDay ? new Date(`${date}T00:00:00`) : new Date(`${date}T${startTime}:00`);
    let end = allDay ? undefined : new Date(`${date}T${endTime}:00`);
    
    if (end && end <= start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    const payload: EventFormPayload = {
      title: trimmedTitle,
      start: start.toISOString(),
      end: end?.toISOString(),
      allDay,
      location: location.trim() || undefined,
      tagIds: tagId ? [tagId] : [],
      recurrence: buildRecurrenceForSave(),
    };

    if (!editingOccurrence) {
      addEvent(payload);
      onClose();
      return;
    }

    if (!isRecurring) {
      updateEvent(editingOccurrence.masterId, payload);
      onClose();
      return;
    }

    setPendingPayload(payload);
    setScopeAction('save');
  }

  function handleDelete() {
    if (!editingOccurrence) return;
    if (!isRecurring) {
      deleteEvent(editingOccurrence.masterId);
      onClose();
      return;
    }
    setScopeAction('delete');
  }

  function handleScopeChosen(scope: RecurrenceScope) {
    if (!editingOccurrence) return;
    if (scopeAction === 'save' && pendingPayload) {
      updateEventOccurrence(editingOccurrence.masterId, editingOccurrence.originalStart, pendingPayload, scope);
    } else if (scopeAction === 'delete') {
      deleteEventOccurrence(editingOccurrence.masterId, editingOccurrence.originalStart, scope);
    }
    setScopeAction(null);
    setPendingPayload(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            {editingOccurrence ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team Sync"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="mb-1 block text-sm font-medium text-slate-300">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3 grid grid-cols-2 gap-3">
              {/* START TIME PICKER */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-slate-300">Start time</label>
                <button
                  type="button"
                  disabled={allDay}
                  onClick={() => setIsStartClockOpen(true)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800/50 disabled:text-slate-500"
                >
                  {startTime}
                </button>

                {isStartClockOpen && (
                  <AndroidTimePicker
                    value={startTime}
                    onChange={(newTime) => setStartTime(newTime)}
                    onClose={() => setIsStartClockOpen(false)}
                  />
                )}
              </div>

              {/* END TIME PICKER */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-slate-300">End time</label>
                <button
                  type="button"
                  disabled={allDay}
                  onClick={() => setIsEndClockOpen(true)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800/50 disabled:text-slate-500"
                >
                  {endTime}
                </button>

                {isEndClockOpen && (
                  <AndroidTimePicker
                    value={endTime}
                    onChange={(newTime) => setEndTime(newTime)}
                    onClose={() => setIsEndClockOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            All day
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Repeat</label>
            <RepeatSelect mode={repeatMode} eventDate={eventDateForRepeat} onChange={handleRepeatModeChange} />
            {repeatMode === 'custom' && customRule && (
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs text-slate-500">{describeRecurrenceRule(customRule, eventDateForRepeat)}</p>
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(true)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Category</label>
            <TagPicker selectedTagId={tagId} onChange={setTagId} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {editingOccurrence ? (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                {editingOccurrence ? 'Save changes' : 'Add event'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {customModalOpen && customRule && (
        <CustomRecurrenceModal
          initialRule={customRule}
          eventDate={eventDateForRepeat}
          onSave={(rule) => {
            setCustomRule(rule);
            setCustomModalOpen(false);
          }}
          onClose={() => setCustomModalOpen(false)}
        />
      )}

      {scopeAction && (
        <EditScopeDialog
          verb={scopeAction === 'save' ? 'Save' : 'Delete'}
          onChoose={handleScopeChosen}
          onCancel={() => {
            setScopeAction(null);
            setPendingPayload(null);
          }}
        />
      )}
    </div>
  );
}
