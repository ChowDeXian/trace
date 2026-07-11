import { describe, expect, it } from 'vitest';
import {
  bestWorstDays,
  computeStreaks,
  dailyStats,
  dayOfWeekStats,
  feelingBreakdown,
  movingAverage,
  tagCorrelations,
  tagFeelingCounts,
  timeOfDayStats,
  todBucket,
} from '../src/lib/insights';
import type { Entry, Feeling, Intensity, Tag } from '../src/types';

let seq = 0;
function entry(
  dateKey: string,
  feeling: Feeling,
  intensity: Intensity,
  tagIds: string[] = [],
  createdAt?: number
): Entry {
  seq += 1;
  return {
    id: `e${seq}`,
    createdAt: createdAt ?? seq,
    updatedAt: seq,
    dateKey,
    feeling,
    intensity,
    note: '',
    tagIds,
  };
}

/** Local-time epoch ms for a given date key and hour. */
function at(dateKey: string, hour: number): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, hour).getTime();
}

describe('dailyStats', () => {
  it('averages valence and intensity per day and sorts ascending', () => {
    const daily = dailyStats([
      entry('2026-07-02', 'calm', 10), // valence +7
      entry('2026-07-01', 'sad', 4), // valence -4
      entry('2026-07-01', 'happy', 8), // valence +8
    ]);
    expect(daily).toHaveLength(2);
    expect(daily[0].dateKey).toBe('2026-07-01');
    expect(daily[0].avgValence).toBe(2); // (-4 + 8) / 2
    expect(daily[0].avgIntensity).toBe(6); // (4 + 8) / 2
    expect(daily[0].count).toBe(2);
    expect(daily[1]).toMatchObject({ dateKey: '2026-07-02', avgValence: 7, count: 1 });
  });

  it('picks the most frequent feeling as dominant', () => {
    const daily = dailyStats([
      entry('2026-07-01', 'anxious', 5),
      entry('2026-07-01', 'anxious', 3),
      entry('2026-07-01', 'happy', 10),
    ]);
    expect(daily[0].dominant).toBe('anxious');
  });

  it('breaks dominant ties by higher summed intensity', () => {
    const daily = dailyStats([entry('2026-07-01', 'sad', 4), entry('2026-07-01', 'happy', 8)]);
    expect(daily[0].dominant).toBe('happy');
  });

  it('returns empty for no entries', () => {
    expect(dailyStats([])).toEqual([]);
  });
});

describe('movingAverage', () => {
  it('averages over a trailing window', () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
  });

  it('handles a window larger than the data', () => {
    expect(movingAverage([2, 4], 7)).toEqual([2, 3]);
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
  it('ranks days by average valence', () => {
    const daily = dailyStats([
      entry('2026-07-01', 'sad', 9), // -9
      entry('2026-07-02', 'happy', 9), // +9
      entry('2026-07-03', 'neutral', 5), // 0
    ]);
    const { best, worst } = bestWorstDays(daily, 1);
    expect(best[0].dateKey).toBe('2026-07-02');
    expect(worst[0].dateKey).toBe('2026-07-01');
  });
});

describe('dayOfWeekStats', () => {
  it('groups daily valence by weekday', () => {
    // 2026-07-06 is a Monday, 2026-07-13 the next Monday, 2026-07-07 a Tuesday
    const daily = dailyStats([
      entry('2026-07-06', 'sad', 4), // -4
      entry('2026-07-13', 'happy', 8), // +8
      entry('2026-07-07', 'calm', 10), // +7
    ]);
    const dow = dayOfWeekStats(daily);
    const monday = dow.find((d) => d.dow === 1)!;
    const tuesday = dow.find((d) => d.dow === 2)!;
    expect(monday).toEqual({ dow: 1, avgValence: 2, count: 2 });
    expect(tuesday).toEqual({ dow: 2, avgValence: 7, count: 1 });
  });
});

describe('feelingBreakdown', () => {
  const today = '2026-07-11';

  it('counts, shares and average intensity per feeling', () => {
    const stats = feelingBreakdown(
      [
        entry('2026-07-10', 'happy', 6),
        entry('2026-07-11', 'happy', 8),
        entry('2026-07-11', 'anxious', 4),
        entry('2026-07-09', 'neutral', 5),
      ],
      today
    );
    const happy = stats.find((s) => s.feeling === 'happy')!;
    expect(happy.count).toBe(2);
    expect(happy.share).toBe(0.5);
    expect(happy.avgIntensity).toBe(7);
    const sad = stats.find((s) => s.feeling === 'sad')!;
    expect(sad.count).toBe(0);
    expect(sad.avgIntensity).toBe(0);
  });

  it('buckets counts into trailing weeks, newest last', () => {
    const stats = feelingBreakdown(
      [
        entry('2026-07-11', 'happy', 5), // age 0 → newest bucket
        entry('2026-07-05', 'happy', 5), // age 6 → newest bucket
        entry('2026-07-04', 'happy', 5), // age 7 → second-newest bucket
        entry('2026-01-01', 'happy', 5), // far outside the window → dropped from sparkline
      ],
      today,
      8
    );
    const happy = stats.find((s) => s.feeling === 'happy')!;
    expect(happy.weeklyCounts).toHaveLength(8);
    expect(happy.weeklyCounts[7]).toBe(2);
    expect(happy.weeklyCounts[6]).toBe(1);
    expect(happy.weeklyCounts.slice(0, 6)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(happy.count).toBe(4); // total still counts everything in range
  });

  it('returns all six feelings even with no entries', () => {
    const stats = feelingBreakdown([], today);
    expect(stats).toHaveLength(6);
    expect(stats.every((s) => s.count === 0 && s.share === 0)).toBe(true);
  });
});

describe('timeOfDayStats', () => {
  it('maps hours to the right buckets', () => {
    expect(todBucket(5)).toBe('morning');
    expect(todBucket(11)).toBe('morning');
    expect(todBucket(12)).toBe('afternoon');
    expect(todBucket(16)).toBe('afternoon');
    expect(todBucket(17)).toBe('evening');
    expect(todBucket(21)).toBe('evening');
    expect(todBucket(22)).toBe('night');
    expect(todBucket(23)).toBe('night');
    expect(todBucket(0)).toBe('night');
    expect(todBucket(4)).toBe('night');
  });

  it('always returns all four buckets in order, empty ones with dominant null', () => {
    const stats = timeOfDayStats([
      entry('2026-07-11', 'happy', 10, [], at('2026-07-11', 8)),
      entry('2026-07-11', 'anxious', 5, [], at('2026-07-11', 23)),
      entry('2026-07-11', 'anxious', 5, [], at('2026-07-11', 2)),
    ]);
    expect(stats.map((s) => s.bucket)).toEqual(['morning', 'afternoon', 'evening', 'night']);
    expect(stats[0]).toMatchObject({ bucket: 'morning', count: 1, avgValence: 10, dominant: 'happy' });
    expect(stats[1]).toMatchObject({ bucket: 'afternoon', count: 0, avgValence: 0, dominant: null });
    expect(stats[3]).toMatchObject({ bucket: 'night', count: 2, avgValence: -4, dominant: 'anxious' });
  });
});

describe('tagCorrelations', () => {
  const tags: Tag[] = [
    { id: 'gym', name: 'gym', builtin: true },
    { id: 'work', name: 'work', builtin: true },
  ];

  it('computes per-tag average valence and delta vs overall', () => {
    const entries = [
      entry('2026-07-01', 'happy', 10, ['gym']), // +10
      entry('2026-07-02', 'happy', 10, ['gym']),
      entry('2026-07-03', 'happy', 10, ['gym']),
      entry('2026-07-04', 'sad', 10, ['work']), // -10
      entry('2026-07-05', 'sad', 10, ['work']),
      entry('2026-07-06', 'sad', 10, ['work']),
    ];
    const stats = tagCorrelations(entries, tags, 3);
    expect(stats).toHaveLength(2);
    expect(stats[0].name).toBe('gym'); // sorted by delta desc
    expect(stats[0].avgValence).toBe(10);
    expect(stats[0].delta).toBe(10); // overall average is 0
    expect(stats[1].delta).toBe(-10);
  });

  it('excludes tags below the minimum count', () => {
    const entries = [entry('2026-07-01', 'happy', 5, ['gym']), entry('2026-07-02', 'neutral', 3, [])];
    expect(tagCorrelations(entries, tags, 3)).toEqual([]);
  });

  it('returns empty for no entries', () => {
    expect(tagCorrelations([], tags)).toEqual([]);
  });
});

describe('tagFeelingCounts', () => {
  const tags: Tag[] = [
    { id: 'gym', name: 'gym', builtin: true },
    { id: 'work', name: 'work', builtin: true },
  ];

  it('counts feelings per tag and sorts by total', () => {
    const entries = [
      entry('2026-07-01', 'anxious', 5, ['work']),
      entry('2026-07-02', 'anxious', 6, ['work']),
      entry('2026-07-03', 'frustrated', 7, ['work']),
      entry('2026-07-04', 'happy', 8, ['work']),
      entry('2026-07-05', 'happy', 8, ['gym']),
      entry('2026-07-06', 'calm', 6, ['gym']),
      entry('2026-07-07', 'calm', 5, ['gym']),
    ];
    const stats = tagFeelingCounts(entries, tags, 3);
    expect(stats).toHaveLength(2);
    expect(stats[0].name).toBe('work');
    expect(stats[0].total).toBe(4);
    expect(stats[0].counts.anxious).toBe(2);
    expect(stats[0].counts.sad).toBe(0);
    expect(stats[1].counts.calm).toBe(2);
  });

  it('excludes tags below the minimum count', () => {
    const entries = [entry('2026-07-01', 'happy', 5, ['gym'])];
    expect(tagFeelingCounts(entries, tags, 3)).toEqual([]);
  });
});
