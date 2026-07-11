import type { DayPoint } from '../lib/insights';
import { MOODS, MOOD_VALUES, roundMood } from '../lib/mood';
import { formatMonth, monthGrid, todayKey, weekdayNames } from '../lib/dates';

interface Props {
  year: number;
  month: number; // 0-based
  daily: Map<string, DayPoint>;
  weekStartsOn: 0 | 1;
  selectedDay: string | null;
  onSelectDay: (key: string | null) => void;
  onNavigate: (year: number, month: number) => void;
}

export function CalendarGrid({ year, month, daily, weekStartsOn, selectedDay, onSelectDay, onNavigate }: Props) {
  const today = todayKey();
  const cells = monthGrid(year, month, weekStartsOn);

  const nav = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onNavigate(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="card">
      <div className="cal-nav">
        <button onClick={() => nav(-1)} aria-label="Previous month">
          ◀
        </button>
        <span className="cal-title">{formatMonth(year, month)}</span>
        <button onClick={() => nav(1)} aria-label="Next month">
          ▶
        </button>
      </div>
      <div className="cal-grid">
        {weekdayNames(weekStartsOn).map((n) => (
          <div key={n} className="cal-dow">
            {n}
          </div>
        ))}
        {cells.map(({ key, inMonth }) => {
          const point = daily.get(key);
          const mood = point ? MOODS[roundMood(point.avg)] : null;
          const classes = [
            'cal-cell',
            !inMonth && 'out',
            key > today && 'future',
            key === today && 'today',
            key === selectedDay && 'selected',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={key}
              className={classes}
              style={mood ? { background: `${mood.color}59` } : undefined}
              onClick={() => onSelectDay(key === selectedDay ? null : key)}
              disabled={key > today}
            >
              {Number(key.slice(8))}
              {mood && <span className="cal-dot" style={{ background: mood.color }} />}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        {MOOD_VALUES.map((m) => (
          <span key={m}>
            <i style={{ background: MOODS[m].color }} />
            {MOODS[m].label}
          </span>
        ))}
      </div>
    </div>
  );
}
