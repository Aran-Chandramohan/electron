import { describe, expect, it } from 'vitest';
import type { Event, RecurrenceRule } from '../../types/schema';
import {
  classifyRecurrenceRule,
  expandEventsForRange,
  getOccurrenceStarts,
  nthWeekdayOfMonth,
  splitRecurrenceSeries,
  validateRecurrenceRule,
} from './recurrence';

const TZ = 'America/Chicago';

function baseEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    archived: false,
    tagIds: [],
    title: 'Test event',
    start: '2026-09-23T14:00:00',
    end: '2026-09-23T15:30:00',
    ...overrides,
  };
}

describe('getOccurrenceStarts', () => {
  it('non-recurring: a plain event is just itself (handled by expandEventsForRange, not this function)', () => {
    // getOccurrenceStarts always assumes a rule; non-recurring events are
    // covered separately below via expandEventsForRange.
    expect(true).toBe(true);
  });

  it('daily: generates one occurrence per day', () => {
    const dtstart = new Date(2026, 8, 23, 14, 0); // Wed Sep 23 2026, 2pm local
    const rule: RecurrenceRule = { freq: 'DAILY', interval: 1, timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 8, 27, 23, 59));
    expect(occurrences).toHaveLength(5);
    expect(occurrences.map((d) => d.getDate())).toEqual([23, 24, 25, 26, 27]);
    occurrences.forEach((d) => expect(d.getHours()).toBe(14));
  });

  it('weekly: generates one occurrence per week on the same weekday', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0); // Wednesday
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [dtstart.getDay()], timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 9, 21, 23, 59, 59));
    // Sep 23, 30, Oct 7, 14, 21
    expect(occurrences).toHaveLength(5);
    occurrences.forEach((d) => {
      expect(d.getDay()).toBe(3); // Wednesday
      expect(d.getHours()).toBe(10);
    });
  });

  it('custom weekly: supports multiple selected weekdays', () => {
    const dtstart = new Date(2026, 8, 23, 9, 0); // Wednesday
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [1, 3, 5], timezone: TZ }; // Mon, Wed, Fri
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 8, 30, 23, 59, 59));
    const weekdays = occurrences.map((d) => d.getDay());
    expect(weekdays).toEqual([3, 5, 1, 3]); // Wed23, Fri25, Mon28, Wed30
  });

  it('every 2 weeks: skips alternating weeks', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0); // Wednesday
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 2, byWeekday: [3], timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 10, 4, 23, 59, 59));
    // Sep 23, Oct 7, Oct 21, Nov 4
    expect(occurrences.map((d) => d.getDate())).toEqual([23, 7, 21, 4]);
  });

  it('monthly on the same date each month', () => {
    const dtstart = new Date(2026, 0, 15, 12, 0); // Jan 15
    const rule: RecurrenceRule = { freq: 'MONTHLY', interval: 1, monthlyMode: 'date', timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 4, 1));
    expect(occurrences.map((d) => d.getMonth())).toEqual([0, 1, 2, 3]);
    occurrences.forEach((d) => expect(d.getDate()).toBe(15));
  });

  it('monthly on the nth weekday (e.g. 2nd Tuesday)', () => {
    const dtstart = new Date(2026, 8, 8, 9, 0); // Tue Sep 8 2026 is the 2nd Tuesday of September
    expect(nthWeekdayOfMonth(dtstart)).toBe(2);
    const rule: RecurrenceRule = { freq: 'MONTHLY', interval: 1, monthlyMode: 'weekday', timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2026, 11, 31));
    // 2nd Tuesday of Sep, Oct, Nov, Dec 2026
    expect(occurrences.map((d) => d.getDate())).toEqual([8, 13, 10, 8]);
    occurrences.forEach((d) => expect(d.getDay()).toBe(2));
  });

  it('respects an end date (until) — generates nothing beyond it', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0);
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [3], until: '2026-10-07', timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2027, 0, 1));
    expect(occurrences.map((d) => d.getDate())).toEqual([23, 30, 7]);
  });

  it('with no end date, keeps generating indefinitely', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0);
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, new Date(2030, 0, 1), new Date(2030, 0, 31));
    expect(occurrences.length).toBeGreaterThan(0);
  });

  it('respects a count limit', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0);
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [3], count: 3, timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2027, 0, 1));
    expect(occurrences).toHaveLength(3);
  });

  it('DST transition: a weekly local-time event stays at the same hour across the change', () => {
    // US "spring forward" in 2027 is Sun Mar 14. A Sunday 10am weekly event
    // spanning several weeks around it must read 10am local every time —
    // never 9am/11am — regardless of what the runtime's local zone is.
    const dtstart = new Date(2027, 1, 21, 10, 0); // Sun Feb 21 2027, 10am
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [0], timezone: TZ };
    const occurrences = getOccurrenceStarts(rule, dtstart, dtstart, new Date(2027, 3, 4));
    expect(occurrences.length).toBeGreaterThanOrEqual(5);
    occurrences.forEach((d) => {
      expect(d.getHours()).toBe(10);
      expect(d.getMinutes()).toBe(0);
    });
  });
});

describe('validateRecurrenceRule', () => {
  const dtstart = new Date(2026, 8, 23);

  it('rejects a fractional or zero interval', () => {
    expect(validateRecurrenceRule({ freq: 'DAILY', interval: 0, timezone: TZ }, dtstart)).toMatch(/interval/i);
    expect(validateRecurrenceRule({ freq: 'DAILY', interval: 1.5, timezone: TZ }, dtstart)).toMatch(/interval/i);
  });

  it('rejects weekly recurrence with no weekday selected', () => {
    expect(validateRecurrenceRule({ freq: 'WEEKLY', interval: 1, byWeekday: [], timezone: TZ }, dtstart)).toMatch(/day/i);
  });

  it('rejects an end date before the start date', () => {
    expect(
      validateRecurrenceRule({ freq: 'DAILY', interval: 1, until: '2026-09-01', timezone: TZ }, dtstart)
    ).toMatch(/end date/i);
  });

  it('accepts a valid rule', () => {
    expect(validateRecurrenceRule({ freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ }, dtstart)).toBeNull();
  });
});

describe('classifyRecurrenceRule', () => {
  const dtstart = new Date(2026, 8, 23); // Wednesday

  it('classifies a plain daily rule as "daily"', () => {
    expect(classifyRecurrenceRule({ freq: 'DAILY', interval: 1, timezone: TZ }, dtstart)).toBe('daily');
  });

  it('classifies a single-weekday-matching-event weekly rule as "weekly"', () => {
    expect(classifyRecurrenceRule({ freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ }, dtstart)).toBe('weekly');
  });

  it('classifies anything else (interval, extra weekdays, end date) as "custom"', () => {
    expect(classifyRecurrenceRule({ freq: 'WEEKLY', interval: 2, byWeekday: [3], timezone: TZ }, dtstart)).toBe('custom');
    expect(classifyRecurrenceRule({ freq: 'WEEKLY', interval: 1, byWeekday: [1, 3], timezone: TZ }, dtstart)).toBe('custom');
    expect(classifyRecurrenceRule({ freq: 'DAILY', interval: 1, count: 5, timezone: TZ }, dtstart)).toBe('custom');
  });
});

describe('splitRecurrenceSeries', () => {
  it('caps the earlier segment the day before the split, and preserves an unbounded later segment', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0); // Wed Sep 23
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ };
    const splitPoint = new Date(2026, 9, 21, 10, 0); // Wed Oct 21 (the 5th occurrence)

    const { beforeRule, afterRule } = splitRecurrenceSeries(rule, dtstart, splitPoint);
    expect(beforeRule.until).toBe('2026-10-14'); // last occurrence strictly before the split
    expect(afterRule.until).toBeUndefined();
    expect(afterRule.count).toBeUndefined();

    const beforeOccurrences = getOccurrenceStarts(beforeRule, dtstart, dtstart, new Date(2027, 0, 1));
    expect(beforeOccurrences.map((d) => d.getDate())).toEqual([23, 30, 7, 14]);
  });

  it('translates a count-limited rule so the two segments add up to the original total', () => {
    const dtstart = new Date(2026, 8, 23, 10, 0);
    const rule: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byWeekday: [3], count: 10, timezone: TZ };
    const splitPoint = new Date(2026, 9, 21, 10, 0); // 5th occurrence

    const { afterRule } = splitRecurrenceSeries(rule, dtstart, splitPoint);
    expect(afterRule.count).toBe(6); // occurrence at splitPoint + 5 more = remaining 6 of the original 10
  });
});

describe('expandEventsForRange', () => {
  const rangeStart = new Date(2026, 8, 1);
  const rangeEnd = new Date(2026, 9, 31, 23, 59, 59);

  it('a non-recurring event within range produces exactly one occurrence', () => {
    const events = { 'evt-1': baseEvent() };
    const results = expandEventsForRange(events, rangeStart, rangeEnd);
    expect(results).toHaveLength(1);
    expect(results[0].isRecurring).toBe(false);
    expect(results[0].event.start).toBe(events['evt-1'].start);
  });

  it('preserves the original duration on every generated occurrence', () => {
    const events = {
      'evt-1': baseEvent({
        recurrence: { freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ },
      }),
    };
    const results = expandEventsForRange(events, rangeStart, rangeEnd);
    expect(results.length).toBeGreaterThan(1);
    results.forEach((r) => {
      const durationMs = new Date(r.event.end!).getTime() - new Date(r.event.start).getTime();
      expect(durationMs).toBe(90 * 60 * 1000); // 1.5 hours, same as the master
    });
  });

  it('excludes a deleted single occurrence but keeps the rest of the series', () => {
    const master = baseEvent({
      recurrence: { freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ },
      excludedDates: [new Date(2026, 8, 30, 14, 0).toISOString()],
    });
    const results = expandEventsForRange({ 'evt-1': master }, rangeStart, rangeEnd);
    const dates = results.map((r) => new Date(r.event.start).getDate());
    expect(dates).not.toContain(30);
    expect(dates).toContain(23);
    expect(dates).toContain(7);
  });

  it('applies an override (moved/edited occurrence) in place of the generated instance', () => {
    const master = baseEvent({ recurrence: { freq: 'WEEKLY', interval: 1, byWeekday: [3], timezone: TZ } });
    const originalStart = new Date(2026, 8, 30, 14, 0).toISOString();
    const override = baseEvent({
      id: 'evt-1-exception',
      title: 'Moved occurrence',
      start: new Date(2026, 9, 1, 14, 0).toISOString(),
      end: new Date(2026, 9, 1, 15, 30).toISOString(),
      recurrenceId: 'evt-1',
      originalStart,
    });
    const results = expandEventsForRange({ 'evt-1': master, 'evt-1-exception': override }, rangeStart, rangeEnd);

    const exception = results.find((r) => r.isException);
    expect(exception).toBeDefined();
    expect(exception!.event.title).toBe('Moved occurrence');
    expect(new Date(exception!.event.start).getDate()).toBe(1);
    expect(exception!.originalStart).toBe(originalStart);

    // No duplicate: the generated Sep-30 instance should not also appear.
    const sep30 = results.filter((r) => new Date(r.event.start).getDate() === 30 && r.event.start.startsWith('2026-09'));
    expect(sep30).toHaveLength(0);
  });

  it('never generates occurrences outside the requested range', () => {
    const master = baseEvent({ recurrence: { freq: 'DAILY', interval: 1, timezone: TZ } });
    const results = expandEventsForRange({ 'evt-1': master }, rangeStart, rangeEnd);
    results.forEach((r) => {
      const start = new Date(r.event.start);
      expect(start >= rangeStart && start <= rangeEnd).toBe(true);
    });
  });
});
