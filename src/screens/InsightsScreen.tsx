import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { MoodLineChart } from '../components/charts/MoodLineChart';
import { TagBarChart } from '../components/charts/TagBarChart';
import {
  bestWorstDays,
  computeStreaks,
  dailyAverages,
  dayOfWeekAverages,
  tagCorrelations,
} from '../lib/insights';
import { MOODS, roundMood } from '../lib/mood';
import { addDays, dayName, formatDateShort, todayKey } from '../lib/dates';

type Range = 30 | 90 | 0; // 0 = all

export function InsightsScreen() {
  const { state } = useApp();
  const [range, setRange] = useState<Range>(30);
  const today = todayKey();

  const entries = useMemo(() => {
    if (range === 0) return state.entries;
    const cutoff = addDays(today, -(range - 1));
    return state.entries.filter((e) => e.dateKey >= cutoff);
  }, [state.entries, range, today]);

  const daily = useMemo(() => dailyAverages(entries), [entries]);
  const streaks = useMemo(
    () => computeStreaks(new Set(state.entries.map((e) => e.dateKey)), today),
    [state.entries, today]
  );
  const { best, worst } = useMemo(() => bestWorstDays(daily), [daily]);
  const dow = useMemo(() => dayOfWeekAverages(daily), [daily]);
  const tagStats = useMemo(() => tagCorrelations(entries, state.tags), [entries, state.tags]);

  const bestDow = dow.length ? dow.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;
  const worstDow = dow.length ? dow.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;

  if (state.entries.length === 0) {
    return (
      <div>
        <div className="screen-title">Insights</div>
        <div className="empty-hint">Log a few moods first — trends will show up here.</div>
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
        <div className="chart-title">Mood over time</div>
        <MoodLineChart daily={daily} />
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
                  <span className="muted">{MOODS[roundMood(bestDow.avg)].emoji} {bestDow.avg.toFixed(1)}</span>
                </span>
              </div>
              <div className="stat-row">
                <span>Toughest weekday</span>
                <span>
                  {dayName(worstDow.dow)}{' '}
                  <span className="muted">{MOODS[roundMood(worstDow.avg)].emoji} {worstDow.avg.toFixed(1)}</span>
                </span>
              </div>
            </>
          )}
          {best[0] && (
            <div className="stat-row">
              <span>Best day</span>
              <span>
                {formatDateShort(best[0].dateKey)}{' '}
                <span className="muted">{MOODS[roundMood(best[0].avg)].emoji} {best[0].avg.toFixed(1)}</span>
              </span>
            </div>
          )}
          {worst[0] && worst[0].dateKey !== best[0]?.dateKey && (
            <div className="stat-row">
              <span>Toughest day</span>
              <span>
                {formatDateShort(worst[0].dateKey)}{' '}
                <span className="muted">{MOODS[roundMood(worst[0].avg)].emoji} {worst[0].avg.toFixed(1)}</span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="chart-title">Mood by tag</div>
        <TagBarChart stats={tagStats} />
        {tagStats.length > 0 && (
          <div className="chart-sub">
            Average mood when tagged, vs your overall average. Needs ≥3 uses per tag.
          </div>
        )}
      </div>
    </div>
  );
}
