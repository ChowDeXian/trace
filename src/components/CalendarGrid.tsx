import type { DayPoint } from '../lib/insights';
import { FEELINGS } from '../types';
import { FEELING_META } from '../lib/feelings';
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

/** Cell tint: dominant feeling's hue, deeper for higher average intensity. */
function cellAlphaHex(avgIntensity: number): string {
  const alpha = 0.18 + 0.42 * (avgIntensity / 10);
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
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
          const meta = point ? FEELING_META[point.dominant] : null;
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
              style={
                meta && point ? { background: meta.color + cellAlphaHex(point.avgIntensity) } : undefined
              }
              onClick={() => onSelectDay(key === selectedDay ? null : key)}
              disabled={key > today}
            >
              {Number(key.slice(8))}
              {meta && <span className="cal-dot" style={{ background: meta.color }} />}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        {FEELINGS.map((f) => (
          <span key={f}>
            <i style={{ background: FEELING_META[f].color }} />
            {FEELING_META[f].label}
          </span>
        ))}
      </div>
    </div>
  );
}
