// ============================================================================
// Recurrence engine for the Calendar module.
//
// Occurrences of a recurring event are never materialized into separate
// stored rows — a recurring "master" Event (the one with `recurrence` set)
// is expanded into instances on demand, for whatever date range a view is
// currently showing. Individually edited/moved/deleted occurrences become
// small "exception" Events (via `recurrenceId` + `originalStart`) or entries
// in the master's `excludedDates`, rather than detaching from the rule.
//
// DST correctness: rrule.js does its date math in UTC. To keep a recurring
// event at the same LOCAL time across a DST transition (a weekly 10am event
// must stay 10am local, not drift to 9am/11am), we never let rrule see real
// UTC instants. Instead we hand it a "shadow" Date built from the local
// Y/M/D/H/M/S components stamped as if they were UTC, do all recurrence
// arithmetic in that calendar-only space, then convert back to a real local
// Date at the end (`localToShadowUTC` / `shadowUTCToLocal`). Native
// `Date`'s local-component constructor already resolves DST correctly for
// whatever date results, so the only place DST could leak in is if we ever
// added raw milliseconds across a multi-day span — which this module
// deliberately never does for stepping between occurrences.
// ============================================================================

import { RRule, Weekday } from 'rrule';
import type { Event, ID, RecurrenceRule } from '../../types/schema';

const RRULE_FREQ: Record<RecurrenceRule['freq'], number> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};

// Index 0=Sun..6=Sat, matching Date#getDay() — used throughout the app.
const RRULE_WEEKDAYS: Weekday[] = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];

export const WEEKDAY_SHORT_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function localToShadowUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

function shadowUTCToLocal(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
}

function toDateOnlyKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Which occurrence of its weekday `date` is within its month: 1st, 2nd, ...,
// or -1 if it's the LAST occurrence of that weekday in the month (rrule's
// convention for "last Tuesday of the month").
export function nthWeekdayOfMonth(date: Date): number {
  const n = Math.ceil(date.getDate() / 7);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return date.getDate() + 7 > daysInMonth ? -1 : n;
}

function ordinalLabel(n: number): string {
  if (n === -1) return 'last';
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

export function describeMonthlyWeekday(date: Date): string {
  return `the ${ordinalLabel(nthWeekdayOfMonth(date))} ${WEEKDAY_NAMES[date.getDay()]}`;
}

const FREQ_UNIT: Record<RecurrenceRule['freq'], [string, string]> = {
  DAILY: ['day', 'days'],
  WEEKLY: ['week', 'weeks'],
  MONTHLY: ['month', 'months'],
  YEARLY: ['year', 'years'],
};

// Short human summary for the custom-recurrence "Edit" affordance, e.g.
// "Every 2 weeks on Mon, Wed, until 2026-12-31".
export function describeRecurrenceRule(rule: RecurrenceRule, dtstart: Date): string {
  const [unit, unitPlural] = FREQ_UNIT[rule.freq];
  let text = rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unitPlural}`;

  if (rule.freq === 'WEEKLY' && rule.byWeekday?.length) {
    text += ` on ${rule.byWeekday.map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(', ')}`;
  }
  if (rule.freq === 'MONTHLY' && rule.monthlyMode === 'weekday') {
    text += ` on ${describeMonthlyWeekday(dtstart)}`;
  }

  if (rule.until) text += `, until ${rule.until}`;
  else if (rule.count !== undefined) text += `, ${rule.count} time${rule.count === 1 ? '' : 's'}`;

  return text;
}

function buildRRuleOptions(rule: RecurrenceRule, dtstart: Date) {
  const options: ConstructorParameters<typeof RRule>[0] = {
    freq: RRULE_FREQ[rule.freq],
    interval: rule.interval,
    dtstart: localToShadowUTC(dtstart),
  };

  if (rule.freq === 'WEEKLY' && rule.byWeekday?.length) {
    options.byweekday = rule.byWeekday.map((d) => RRULE_WEEKDAYS[d]);
  }

  if (rule.freq === 'MONTHLY' && rule.monthlyMode === 'weekday') {
    options.byweekday = [RRULE_WEEKDAYS[dtstart.getDay()].nth(nthWeekdayOfMonth(dtstart))];
  }

  if (rule.until) {
    // Inclusive end-of-day so an event landing exactly on `until` still counts.
    const [y, m, d] = rule.until.split('-').map(Number);
    options.until = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  }

  if (rule.count !== undefined) {
    options.count = rule.count;
  }

  return options;
}

// All occurrence start times (as real local Dates) between rangeStart and
// rangeEnd, inclusive.
export function getOccurrenceStarts(rule: RecurrenceRule, dtstart: Date, rangeStart: Date, rangeEnd: Date): Date[] {
  const rr = new RRule(buildRRuleOptions(rule, dtstart));
  const shadowMatches = rr.between(localToShadowUTC(rangeStart), localToShadowUTC(rangeEnd), true);
  return shadowMatches.map(shadowUTCToLocal);
}

export function validateRecurrenceRule(rule: RecurrenceRule, dtstart: Date): string | null {
  if (!Number.isInteger(rule.interval) || rule.interval < 1) {
    return 'Interval must be a whole number of 1 or more.';
  }
  if (rule.freq === 'WEEKLY' && (!rule.byWeekday || rule.byWeekday.length === 0)) {
    return 'Select at least one day of the week.';
  }
  if (rule.until) {
    const [y, m, d] = rule.until.split('-').map(Number);
    const untilDate = new Date(y, m - 1, d);
    const dtstartDateOnly = new Date(dtstart.getFullYear(), dtstart.getMonth(), dtstart.getDate());
    if (untilDate < dtstartDateOnly) {
      return 'End date cannot be before the start date.';
    }
  }
  if (rule.count !== undefined && rule.count < 1) {
    return 'Number of occurrences must be at least 1.';
  }
  return null;
}

// Classifies a rule as one of the one-click presets so the simple "Repeat"
// dropdown can show the right option when reopening an existing event,
// instead of always falling back to "Custom".
export type SimpleRepeatMode = 'daily' | 'weekly' | 'custom';

export function classifyRecurrenceRule(rule: RecurrenceRule, dtstart: Date): SimpleRepeatMode {
  if (rule.freq === 'DAILY' && rule.interval === 1 && !rule.until && rule.count === undefined) {
    return 'daily';
  }
  if (
    rule.freq === 'WEEKLY' &&
    rule.interval === 1 &&
    rule.byWeekday?.length === 1 &&
    rule.byWeekday[0] === dtstart.getDay() &&
    !rule.until &&
    rule.count === undefined
  ) {
    return 'weekly';
  }
  return 'custom';
}

// Splits a recurring series in two at `splitPoint` (the start time of the
// occurrence being edited/deleted as "this and following"): the returned
// `beforeRule` keeps everything up to (not including) splitPoint, unchanged;
// `afterRule` is what the new series starting at splitPoint should carry —
// same shape, with an occurrence-count budget reduced by however many
// occurrences already happened before the split (an absolute `until` date
// needs no such translation).
export function splitRecurrenceSeries(
  rule: RecurrenceRule,
  dtstart: Date,
  splitPoint: Date
): { beforeRule: RecurrenceRule; afterRule: RecurrenceRule } {
  const occurrencesBefore = getOccurrenceStarts(rule, dtstart, dtstart, new Date(splitPoint.getTime() - 1000));
  const lastBeforeStart = occurrencesBefore[occurrencesBefore.length - 1];

  const beforeRule: RecurrenceRule = {
    ...rule,
    until: toDateOnlyKey(lastBeforeStart ?? new Date(dtstart.getTime() - 86400000)),
    count: undefined,
  };

  const afterRule: RecurrenceRule = {
    ...rule,
    count: rule.count !== undefined ? Math.max(rule.count - occurrencesBefore.length, 0) : undefined,
  };

  return { beforeRule, afterRule };
}

// ---------------------------------------------------------------------------
// Expansion: turns the stored events map into a flat list of instances to
// render for a given visible range.
// ---------------------------------------------------------------------------

export interface EventOccurrence {
  // Display data for this specific instance — start/end are this instance's
  // actual times, not the master's.
  event: Event;
  masterId: ID;
  // ISO start time of this occurrence as originally generated by the rule —
  // stable even if this instance was later moved, so it can be used as the
  // key for future edits/exceptions/deletions.
  originalStart: string;
  isRecurring: boolean;
  isException: boolean;
}

export function expandEventsForRange(
  events: Record<ID, Event>,
  rangeStart: Date,
  rangeEnd: Date
): EventOccurrence[] {
  const all = Object.values(events).filter((e) => !e.archived);
  const overridesByMaster = new Map<ID, Map<string, Event>>();
  for (const e of all) {
    if (e.recurrenceId && e.originalStart) {
      if (!overridesByMaster.has(e.recurrenceId)) overridesByMaster.set(e.recurrenceId, new Map());
      overridesByMaster.get(e.recurrenceId)!.set(e.originalStart, e);
    }
  }

  const results: EventOccurrence[] = [];

  for (const event of all) {
    if (event.recurrenceId) continue; // rendered via its master below

    if (!event.recurrence) {
      const start = new Date(event.start);
      if (start >= rangeStart && start <= rangeEnd) {
        results.push({ event, masterId: event.id, originalStart: event.start, isRecurring: false, isException: false });
      }
      continue;
    }

    const dtstart = new Date(event.start);
    const durationMs = event.end ? new Date(event.end).getTime() - dtstart.getTime() : 0;
    const excluded = new Set(event.excludedDates ?? []);
    const overrides = overridesByMaster.get(event.id);

    for (const occStart of getOccurrenceStarts(event.recurrence, dtstart, rangeStart, rangeEnd)) {
      const key = occStart.toISOString();
      if (excluded.has(key)) continue;

      const override = overrides?.get(key);
      if (override) {
        results.push({ event: override, masterId: event.id, originalStart: key, isRecurring: true, isException: true });
        continue;
      }

      const occEnd = durationMs > 0 ? new Date(occStart.getTime() + durationMs) : undefined;
      results.push({
        event: { ...event, start: occStart.toISOString(), end: occEnd?.toISOString() },
        masterId: event.id,
        originalStart: key,
        isRecurring: true,
        isException: false,
      });
    }
  }

  // Defensive: an override whose master no longer exists renders standalone
  // rather than silently vanishing.
  for (const e of all) {
    if (e.recurrenceId && !events[e.recurrenceId]) {
      const start = new Date(e.start);
      if (start >= rangeStart && start <= rangeEnd) {
        results.push({ event: e, masterId: e.id, originalStart: e.originalStart ?? e.start, isRecurring: false, isException: false });
      }
    }
  }

  return results;
}
