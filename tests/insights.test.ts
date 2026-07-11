import { describe, expect, it } from 'vitest';
import {
  bestWorstDays,
  computeStreaks,
  dailyAverages,
  dayOfWeekAverages,
  movingAverage,
  tagCorrelations,
} from '../src/lib/insights';
import type { Entry, MoodValue, Tag } from '../src/types';

let seq = 0;
function entry(dateKey: string, mood: MoodValue, tagIds: string[] = []): Entry {
  seq += 1;
  return {
    id: `e${seq}`,
    createdAt: seq,
    updatedAt: seq,
    dateKey,
    mood,
    note: '',
    tagIds,
  };
}

describe('dailyAverages', () => {
  it('averages multiple entries per day and sorts ascending', () => {
    const daily = dailyAverages([
      entry('2026-07-02', 4),
      entry('2026-07-01', 2),
      entry('2026-07-01', 4),
    ]);
    expect(daily).toEqual([
      { dateKey: '2026-07-01', avg: 3, count: 2 },
      { dateKey: '2026-07-02', avg: 4, count: 1 },
    ]);
  });

  it('returns empty for no entries', () => {
    expect(dailyAverages([])).toEqual([]);
  });
});

describe('movingAverage', () => {
  it('averages over a trailing window', () => {
    const pts = [1, 2, 3, 4].map((avg, i) => ({ dateKey: `2026-07-0${i + 1}`, avg, count: 1 }));
    expect(movingAverage(pts, 2)).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it('handles a window larger than the data', () => {
    const pts = [2, 4].map((avg, i) => ({ dateKey: `2026-07-0${i + 1}`, avg, count: 1 }));
    expect(movingAverage(pts, 7)).toEqual([2, 3]);
  });
});

describe('computeStreaks', () => {
  const today = '2026-07-11';

  it('is zero with no days', () => {
    expect(computeStreaks(new Set(), today)).toEqual({ current: 0, longest: 0 });
  });

  it('counts a run ending today', () => {
    const days = new Set(['2026-07-09', '2026-07-10', '2026-07-11']);
    expect(computeStreaks(days, today)).toEqual({ current: 3, longest: 3 });
  });

  it('keeps the streak alive when today is empty but yesterday logged', () => {
    const days = new Set(['2026-07-09', '2026-07-10']);
    expect(computeStreaks(days, today).current).toBe(2);
  });

  it('resets current on a gap but tracks the longest run', () => {
    const days = new Set(['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-11']);
    expect(computeStreaks(days, today)).toEqual({ current: 1, longest: 4 });
  });

  it('is zero when the last log was before yesterday', () => {
    const days = new Set(['2026-07-08']);
    expect(computeStreaks(days, today).current).toBe(0);
  });

  it('counts runs across month boundaries', () => {
    const days = new Set(['2026-06-29', '2026-06-30', '2026-07-01']);
    expect(computeStreaks(days, today).longest).toBe(3);
  });
});

describe('bestWorstDays', () => {
  it('returns top and bottom days', () => {
    const daily = dailyAverages([
      entry('2026-07-01', 1),
      entry('2026-07-02', 5),
      entry('2026-07-03', 3),
    ]);
    const { best, worst } = bestWorstDays(daily, 1);
    expect(best[0].dateKey).toBe('2026-07-02');
    expect(worst[0].dateKey).toBe('2026-07-01');
  });
});

describe('dayOfWeekAverages', () => {
  it('groups daily averages by weekday', () => {
    // 2026-07-06 is a Monday, 2026-07-13 the next Monday, 2026-07-07 a Tuesday
    const daily = dailyAverages([
      entry('2026-07-06', 2),
      entry('2026-07-13', 4),
      entry('2026-07-07', 5),
    ]);
    const dow = dayOfWeekAverages(daily);
    const monday = dow.find((d) => d.dow === 1)!;
    const tuesday = dow.find((d) => d.dow === 2)!;
    expect(monday).toEqual({ dow: 1, avg: 3, count: 2 });
    expect(tuesday).toEqual({ dow: 2, avg: 5, count: 1 });
  });
});

describe('tagCorrelations', () => {
  const tags: Tag[] = [
    { id: 'gym', name: 'gym', builtin: true },
    { id: 'work', name: 'work', builtin: true },
  ];

  it('computes per-tag average and delta vs overall', () => {
    const entries = [
      entry('2026-07-01', 5, ['gym']),
      entry('2026-07-02', 5, ['gym']),
      entry('2026-07-03', 5, ['gym']),
      entry('2026-07-04', 1, ['work']),
      entry('2026-07-05', 1, ['work']),
      entry('2026-07-06', 1, ['work']),
    ];
    const stats = tagCorrelations(entries, tags, 3);
    expect(stats).toHaveLength(2);
    expect(stats[0].name).toBe('gym'); // sorted by delta desc
    expect(stats[0].avgMood).toBe(5);
    expect(stats[0].delta).toBe(2);
    expect(stats[1].delta).toBe(-2);
  });

  it('excludes tags below the minimum count', () => {
    const entries = [entry('2026-07-01', 5, ['gym']), entry('2026-07-02', 3, [])];
    expect(tagCorrelations(entries, tags, 3)).toEqual([]);
  });

  it('returns empty for no entries', () => {
    expect(tagCorrelations([], tags)).toEqual([]);
  });
});
