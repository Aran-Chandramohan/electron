import { useState } from 'react';
import type { RecurrenceRule } from '../../types/schema';
import { WeekdayToggle } from './WeekdayToggle';
import { describeMonthlyWeekday, validateRecurrenceRule } from './recurrence';
import { XIcon } from '../../components/icons/Icons';

interface CustomRecurrenceModalProps {
  initialRule: RecurrenceRule;
  eventDate: Date;
  onSave: (rule: RecurrenceRule) => void;
  onClose: () => void;
}

const FREQ_OPTIONS: { value: RecurrenceRule['freq']; unit: string; unitPlural: string }[] = [
  { value: 'DAILY', unit: 'day', unitPlural: 'days' },
  { value: 'WEEKLY', unit: 'week', unitPlural: 'weeks' },
  { value: 'MONTHLY', unit: 'month', unitPlural: 'months' },
  { value: 'YEARLY', unit: 'year', unitPlural: 'years' },
];

type EndMode = 'never' | 'onDate' | 'afterCount';

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function CustomRecurrenceModal({ initialRule, eventDate, onSave, onClose }: CustomRecurrenceModalProps) {
  const [freq, setFreq] = useState<RecurrenceRule['freq']>(initialRule.freq);
  const [interval, setInterval_] = useState(initialRule.interval);
  const [byWeekday, setByWeekday] = useState<number[]>(initialRule.byWeekday ?? [eventDate.getDay()]);
  const [monthlyMode, setMonthlyMode] = useState<'date' | 'weekday'>(initialRule.monthlyMode ?? 'date');
  const [endMode, setEndMode] = useState<EndMode>(
    initialRule.count !== undefined ? 'afterCount' : initialRule.until ? 'onDate' : 'never'
  );
  const [endDate, setEndDate] = useState(initialRule.until ?? toDateInputValue(eventDate.toISOString()));
  const [endCount, setEndCount] = useState(initialRule.count ?? 13);
  const [error, setError] = useState<string | null>(null);

  function buildRule(): RecurrenceRule {
    return {
      freq,
      interval,
      byWeekday: freq === 'WEEKLY' ? byWeekday : undefined,
      monthlyMode: freq === 'MONTHLY' ? monthlyMode : undefined,
      until: endMode === 'onDate' ? endDate : undefined,
      count: endMode === 'afterCount' ? endCount : undefined,
      timezone: initialRule.timezone,
    };
  }

  function handleSave() {
    const rule = buildRule();
    const validationError = validateRecurrenceRule(rule, eventDate);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(rule);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Custom recurrence</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Repeat every</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as RecurrenceRule['freq'])}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {FREQ_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {interval === 1 ? f.unit : f.unitPlural}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {freq === 'WEEKLY' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">On</label>
              <WeekdayToggle selected={byWeekday} onChange={setByWeekday} />
            </div>
          )}

          {freq === 'MONTHLY' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">On</label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={monthlyMode === 'date'}
                  onChange={() => setMonthlyMode('date')}
                  className="h-4 w-4 border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                Day {eventDate.getDate()} of the month
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={monthlyMode === 'weekday'}
                  onChange={() => setMonthlyMode('weekday')}
                  className="h-4 w-4 border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                On {describeMonthlyWeekday(eventDate)}
              </label>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Starts</label>
            <p className="text-sm text-slate-400">
              {eventDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Ends</label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                checked={endMode === 'never'}
                onChange={() => setEndMode('never')}
                className="h-4 w-4 border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              Never
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                checked={endMode === 'onDate'}
                onChange={() => setEndMode('onDate')}
                className="h-4 w-4 border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              On
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setEndMode('onDate');
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                checked={endMode === 'afterCount'}
                onChange={() => setEndMode('afterCount')}
                className="h-4 w-4 border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              After
              <input
                type="number"
                min={1}
                value={endCount}
                onChange={(e) => {
                  setEndCount(Math.max(1, Number(e.target.value) || 1));
                  setEndMode('afterCount');
                }}
                className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              occurrences
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
