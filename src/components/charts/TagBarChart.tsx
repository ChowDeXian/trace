import type { TagStat } from '../../lib/insights';

interface Props {
  stats: TagStat[]; // sorted by delta desc
}

const BAR_H = 22;
const GAP = 6;
const W = 320;
const LABEL_W = 88;
const VALUE_W = 44;

export function TagBarChart({ stats }: Props) {
  if (stats.length === 0) {
    return <div className="empty-hint">Tag a few more entries to see which tags lift or drag your wellbeing.</div>;
  }

  const maxAbs = Math.max(...stats.map((s) => Math.abs(s.delta)), 0.5);
  const barArea = W - LABEL_W - VALUE_W;
  const mid = LABEL_W + barArea / 2;
  const height = stats.length * (BAR_H + GAP) - GAP;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Wellbeing by tag">
      <line x1={mid} x2={mid} y1={0} y2={height} stroke="var(--border)" strokeWidth="1" />
      {stats.map((s, i) => {
        const yTop = i * (BAR_H + GAP);
        const w = (Math.abs(s.delta) / maxAbs) * (barArea / 2);
        const positive = s.delta >= 0;
        return (
          <g key={s.tagId}>
            <text
              x={LABEL_W - 8}
              y={yTop + BAR_H / 2}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--text)"
              fontSize="12"
              fontWeight="600"
            >
              {s.name}
            </text>
            <rect
              x={positive ? mid : mid - w}
              y={yTop + 3}
              width={Math.max(w, 1)}
              height={BAR_H - 6}
              rx={4}
              fill={positive ? 'var(--accent-deep)' : 'var(--danger)'}
              opacity={0.85}
            />
            <text
              x={W - 2}
              y={yTop + BAR_H / 2}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--muted)"
              fontSize="11"
            >
              {positive ? '+' : ''}
              {s.delta.toFixed(1)} ({s.count})
            </text>
          </g>
        );
      })}
    </svg>
  );
}
