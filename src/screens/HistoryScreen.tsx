import { useMemo, useState } from 'react';
import { useApp } from '../state/AppContext';
import { EntryCard } from '../components/EntryCard';
import { CalendarGrid } from '../components/CalendarGrid';
import { dailyStats, type DayPoint } from '../lib/insights';
import { formatDateFull, todayKey } from '../lib/dates';

type View = 'calendar' | 'timeline';

export function HistoryScreen() {
  const { state } = useApp();
  const [view, setView] = useState<View>('calendar');
  const [query, setQuery] = useState('');
  const now = todayKey();
  const [calYear, setCalYear] = useState(() => Number(now.slice(0, 4)));
  const [calMonth, setCalMonth] = useState(() => Number(now.slice(5, 7)) - 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const daily = useMemo(() => {
    const map = new Map<string, DayPoint>();
    for (const p of dailyStats(state.entries)) map.set(p.dateKey, p);
    return map;
  }, [state.entries]);

  const tagNameById = useMemo(
    () => new Map(state.tags.map((t) => [t.id, t.name.toLowerCase()])),
    [state.tags]
  );

  const filtered = useMemo(() => {
    let entries = state.entries;
    if (selectedDay) entries = entries.filter((e) => e.dateKey === selectedDay);
    const q = query.trim().toLowerCase();
    if (q) {
      entries = entries.filter(
        (e) =>
          e.note.toLowerCase().includes(q) ||
          e.tagIds.some((id) => tagNameById.get(id)?.includes(q))
      );
    }
    return entries;
  }, [state.entries, selectedDay, query, tagNameById]);

  const groups = useMemo(() => {
    const out: { dateKey: string; entries: typeof filtered }[] = [];
    for (const e of filtered) {
      const last = out[out.length - 1];
      if (last && last.dateKey === e.dateKey) last.entries.push(e);
      else out.push({ dateKey: e.dateKey, entries: [e] });
    }
    return out;
  }, [filtered]);

  return (
    <div>
      <div className="screen-title">History</div>
      <div className="screen-sub">
        {state.entries.length} {state.entries.length === 1 ? 'entry' : 'entries'} logged
      </div>

      <div className="segmented">
        <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
          Calendar
        </button>
        <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>
          Timeline
        </button>
      </div>

      <input
        className="search-input"
        type="search"
        placeholder="Search notes and tags…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {view === 'calendar' && (
        <CalendarGrid
          year={calYear}
          month={calMonth}
          daily={daily}
          weekStartsOn={state.settings.weekStartsOn}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onNavigate={(y, m) => {
            setCalYear(y);
            setCalMonth(m);
          }}
        />
      )}

      {selectedDay && (
        <div className="screen-sub" style={{ marginBottom: 8 }}>
          Showing {formatDateFull(selectedDay)} —{' '}
          <button className="btn-small" onClick={() => setSelectedDay(null)}>
            show all
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-hint">
          {state.entries.length === 0
            ? 'No entries yet. Log your first feeling on the Today tab.'
            : 'Nothing matches.'}
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.dateKey}>
            <div className="date-header">{formatDateFull(g.dateKey)}</div>
            {g.entries.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
