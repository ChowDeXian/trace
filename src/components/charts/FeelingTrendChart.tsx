import type { FeelingStat } from '../../lib/insights';
import { FEELING_META } from '../../lib/feelings';

interface Props {
  stats: FeelingStat[]; // FEELINGS order; rows with count 0 are hidden
}

const W = 320;
const ROW_H = 30;
const LABEL_W = 110;
const VALUE_W = 76;
const SPARK_H = 18;

export function FeelingTrendChart({ stats }: Props) {
  const rows = stats.filter((s) => s.count > 0);
  if (rows.length === 0) return <div className="empty-hint">No data in this range yet.</div>;

  const sparkArea = W - LABEL_W - VALUE_W;
  const maxWeekly = Math.max(...rows.flatMap((r) => r.weeklyCounts), 1);
  const height = rows.length * ROW_H;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Feeling frequency by week">
      {rows.map((s, i) => {
        const meta = FEELING_META[s.feeling];
        const yTop = i * ROW_H;
        const yMid = yTop + ROW_H / 2;
        const n = s.weeklyCounts.length;
        const barW = (sparkArea - (n - 1) * 2) / n;
        return (
          <g key={s.feeling}>
            <text x={0} y={yMid} dominantBaseline="central" fontSize="13">
              {meta.emoji}
            </text>
            <text
              x={24}
              y={yMid}
              dominantBaseline="central"
              fill="var(--text)"
              fontSize="12"
              fontWeight="600"
            >
              {meta.label}
            </text>
            {s.weeklyCounts.map((c, w) => {
              const h = c === 0 ? 1.5 : Math.max((c / maxWeekly) * SPARK_H, 3);
              return (
                <rect
                  key={w}
                  x={LABEL_W + w * (barW + 2)}
                  y={yMid + SPARK_H / 2 - h}
                  width={barW}
                  height={h}
                  rx={1.5}
                  fill={meta.color}
                  opacity={c === 0 ? 0.25 : 0.9}
                />
              );
            })}
            <text
              x={W - 2}
              y={yMid}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--muted)"
              fontSize="11"
            >
              {s.count}× · avg {s.avgIntensity.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
