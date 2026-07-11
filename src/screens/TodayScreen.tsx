import { useMemo } from 'react';
import { useApp } from '../state/AppContext';
import { EntryEditor } from '../components/EntryEditor';
import { EntryCard } from '../components/EntryCard';
import { computeStreaks } from '../lib/insights';
import { formatDateFull, todayKey } from '../lib/dates';

export function TodayScreen() {
  const { state } = useApp();
  const today = todayKey();
  const todayEntries = state.entries.filter((e) => e.dateKey === today);

  const streak = useMemo(
    () => computeStreaks(new Set(state.entries.map((e) => e.dateKey)), today),
    [state.entries, today]
  );

  return (
    <div>
      <div className="screen-header">
        <div>
          <div className="screen-title">Today</div>
          <div className="screen-sub">{formatDateFull(today)}</div>
        </div>
        {streak.current > 0 && <span className="streak-chip">🔥 {streak.current}-day streak</span>}
      </div>

      <EntryEditor />

      {todayEntries.length > 0 && (
        <>
          <div className="date-header">Logged today</div>
          {todayEntries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </>
      )}
    </div>
  );
}
