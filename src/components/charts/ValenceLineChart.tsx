import type { DayPoint } from '../../lib/insights';
import { movingAverage } from '../../lib/insights';
import { FEELING_META } from '../../lib/feelings';
import { formatDateShort } from '../../lib/dates';

const W = 320;
const H = 170;
const PAD_X = 8;
const PAD_Y = 12;

interface Props {
  daily: DayPoint[]; // sorted ascending
}

export function ValenceLineChart({ daily }: Props) {
  if (daily.length === 0) return <div className="empty-hint">No data in this range yet.</div>;

  const x = (i: number) =>
    daily.length === 1 ? W / 2 : PAD_X + (i * (W - 2 * PAD_X)) / (daily.length - 1);
  const y = (v: number) => H - PAD_Y - ((v + 10) / 20) * (H - 2 * PAD_Y);

  const avg7 = movingAverage(daily.map((p) => p.avgValence), 7);
  const avgLine = avg7.map((a, i) => `${x(i).toFixed(1)},${y(a).toFixed(1)}`).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Wellbeing over time">
        {[-10, -5, 0, 5, 10].map((v) => (
          <line
            key={v}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(v)}
            y2={y(v)}
            stroke={v === 0 ? 'var(--muted)' : 'var(--border)'}
            strokeWidth={v === 0 ? 1.5 : 1}
          />
        ))}
        {daily.length > 1 && (
          <polyline points={avgLine} fill="none" stroke="var(--muted)" strokeWidth="1.5" />
        )}
        {daily.map((p, i) => (
          <circle
            key={p.dateKey}
            cx={x(i)}
            cy={y(p.avgValence)}
            r={daily.length > 60 ? 2 : 3.5}
            fill={FEELING_META[p.dominant].color}
          />
        ))}
      </svg>
      <div className="chart-sub">
        {formatDateShort(daily[0].dateKey)} — {formatDateShort(daily[daily.length - 1].dateKey)} ·
        above the middle line = positive feelings
        {daily.length > 1 && ' · grey line = 7-day average'}
      </div>
    </div>
  );
}
