import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { ValenceLineChart } from '../components/charts/ValenceLineChart';
import { FeelingTrendChart } from '../components/charts/FeelingTrendChart';
import { TimeOfDayChart } from '../components/charts/TimeOfDayChart';
import { TagBarChart } from '../components/charts/TagBarChart';
import { TagFeelingChart } from '../components/charts/TagFeelingChart';
import {
  bestWorstDays,
  computeStreaks,
  dailyStats,
  dayOfWeekStats,
  feelingBreakdown,
  tagCorrelations,
  tagFeelingCounts,
  timeOfDayStats,
} from '../lib/insights';
import { FEELING_META } from '../lib/feelings';
import { addDays, dayName, formatDateShort, todayKey } from '../lib/dates';
import type { DayPoint } from '../lib/insights';

type Range = 30 | 90 | 0; // 0 = all

function signedValence(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
}

function dayValue(p: DayPoint): string {
  return `${FEELING_META[p.dominant].emoji} ${signedValence(p.avgValence)}`;
}

export function InsightsScreen() {
  const { state } = useApp();
  const [range, setRange] = useState<Range>(30);
  const today = todayKey();

  const entries = useMemo(() => {
    if (range === 0) return state.entries;
    const cutoff = addDays(today, -(range - 1));
    return state.entries.filter((e) => e.dateKey >= cutoff);
  }, [state.entries, range, today]);

  const daily = useMemo(() => dailyStats(entries), [entries]);
  const streaks = useMemo(
    () => computeStreaks(new Set(state.entries.map((e) => e.dateKey)), today),
    [state.entries, today]
  );
  const { best, worst } = useMemo(() => bestWorstDays(daily), [daily]);
  const dow = useMemo(() => dayOfWeekStats(daily), [daily]);
  const feelings = useMemo(() => feelingBreakdown(entries, today), [entries, today]);
  const tod = useMemo(() => timeOfDayStats(entries), [entries]);
  const tagStats = useMemo(() => tagCorrelations(entries, state.tags), [entries, state.tags]);
  const tagFeelings = useMemo(() => tagFeelingCounts(entries, state.tags), [entries, state.tags]);

  const bestDow = dow.length ? dow.reduce((a, b) => (b.avgValence > a.avgValence ? b : a)) : null;
  const worstDow = dow.length ? dow.reduce((a, b) => (b.avgValence < a.avgValence ? b : a)) : null;

  if (state.entries.length === 0) {
    return (
      <div>
        <div className="screen-title">Insights</div>
        <div className="empty-hint">Log a few feelings first — trends will show up here.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-title">Insights</div>
      <div className="screen-sub">Patterns across your entries</div>

      <div className="segmented">
        {([30, 90, 0] as Range[]).map((r) => (
          <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
            {r === 0 ? 'All' : `${r}d`}
          </button>
        ))}
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="tile-value">🔥 {streaks.current}</div>
          <div className="tile-label">Current streak</div>
        </div>
        <div className="tile">
          <div className="tile-value">{streaks.longest}</div>
          <div className="tile-label">Longest streak</div>
        </div>
        <div className="tile">
          <div className="tile-value">{entries.length}</div>
          <div className="tile-label">Entries</div>
        </div>
      </div>

      <div className="card">
        <div className="chart-title">Wellbeing over time</div>
        <ValenceLineChart daily={daily} />
      </div>

      <div className="card">
        <div className="chart-title">Your feelings</div>
        <FeelingTrendChart stats={feelings} />
        <div className="chart-sub">How often each feeling shows up, week by week (last 8 weeks).</div>
      </div>

      <div className="card">
        <div className="chart-title">Time of day</div>
        <TimeOfDayChart stats={tod} />
        <div className="chart-sub">
          When you log entries, with the most common feeling and average wellbeing.
        </div>
      </div>

      {(best.length > 0 || bestDow) && (
        <div className="card">
          <div className="chart-title">Best & worst</div>
          {bestDow && worstDow && bestDow.dow !== worstDow.dow && (
            <>
              <div className="stat-row">
                <span>Best weekday</span>
                <span>
                  {dayName(bestDow.dow)}{' '}
                  <span className="muted">{signedValence(bestDow.avgValence)}</span>
                </span>
              </div>
              <div className="stat-row">
                <span>Toughest weekday</span>
                <span>
                  {dayName(worstDow.dow)}{' '}
                  <span className="muted">{signedValence(worstDow.avgValence)}</span>
                </span>
              </div>
            </>
          )}
          {best[0] && (
            <div className="stat-row">
              <span>Best day</span>
              <span>
                {formatDateShort(best[0].dateKey)} <span className="muted">{dayValue(best[0])}</span>
              </span>
            </div>
          )}
          {worst[0] && worst[0].dateKey !== best[0]?.dateKey && (
            <div className="stat-row">
              <span>Toughest day</span>
              <span>
                {formatDateShort(worst[0].dateKey)}{' '}
                <span className="muted">{dayValue(worst[0])}</span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="chart-title">Tags that lift or drag</div>
        <TagBarChart stats={tagStats} />
        {tagStats.length > 0 && (
          <div className="chart-sub">
            Average wellbeing when tagged, vs your overall average. Needs ≥3 uses per tag.
          </div>
        )}
      </div>

      <div className="card">
        <div className="chart-title">What you tag each feeling</div>
        <TagFeelingChart stats={tagFeelings} />
        {tagFeelings.length > 0 && (
          <div className="chart-sub">Which feelings show up alongside your most-used tags.</div>
        )}
      </div>
    </div>
  );
}
