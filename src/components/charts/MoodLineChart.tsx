import type { DayPoint } from '../../lib/insights';
import { movingAverage } from '../../lib/insights';
import { MOODS, roundMood } from '../../lib/mood';
import { formatDateShort } from '../../lib/dates';

const W = 320;
const H = 150;
const PAD_X = 8;
const PAD_Y = 12;

interface Props {
  daily: DayPoint[]; // sorted ascending
}

export function MoodLineChart({ daily }: Props) {
  if (daily.length === 0) return <div className="empty-hint">No data in this range yet.</div>;

  const x = (i: number) =>
    daily.length === 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (daily.length - 1);
  const y = (avg: number) => H - PAD_Y - ((avg - 1) / 4) * (H - 2 * PAD_Y);

  const avg7 = movingAverage(daily, 7);
  const avgLine = avg7.map((a, i) => `${x(i).toFixed(1)},${y(a).toFixed(1)}`).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Mood over time">
        {[1, 2, 3, 4, 5].map((m) => (
          <line
            key={m}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(m)}
            y2={y(m)}
            stroke="#2a2a2a"
            strokeWidth="1"
          />
        ))}
        {daily.length > 1 && (
          <polyline points={avgLine} fill="none" stroke="#9a9a9a" strokeWidth="1.5" />
        )}
        {daily.map((p, i) => (
          <circle
            key={p.dateKey}
            cx={x(i)}
            cy={y(p.avg)}
            r={daily.length > 60 ? 2 : 3.5}
            fill={MOODS[roundMood(p.avg)].color}
          />
        ))}
      </svg>
      <div className="chart-sub">
        {formatDateShort(daily[0].dateKey)} — {formatDateShort(daily[daily.length - 1].dateKey)}
        {daily.length > 1 && ' · grey line = 7-day average'}
      </div>
    </div>
  );
}
