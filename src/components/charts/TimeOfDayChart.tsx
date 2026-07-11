import type { TodStat } from '../../lib/insights';
import { FEELING_META } from '../../lib/feelings';

interface Props {
  stats: TodStat[]; // all 4 buckets in order
}

const W = 320;
const ROW_H = 30;
const BAR_H = 14;
const LABEL_W = 92;
const VALUE_W = 82;

const BUCKET_LABELS: Record<TodStat['bucket'], string> = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening: '🌆 Evening',
  night: '🌙 Night',
};

export function TimeOfDayChart({ stats }: Props) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const barArea = W - LABEL_W - VALUE_W;
  const height = stats.length * ROW_H;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Entries by time of day">
      {stats.map((s, i) => {
        const yMid = i * ROW_H + ROW_H / 2;
        const w = (s.count / maxCount) * barArea;
        return (
          <g key={s.bucket}>
            <text x={0} y={yMid} dominantBaseline="central" fill="var(--text)" fontSize="12" fontWeight="600">
              {BUCKET_LABELS[s.bucket]}
            </text>
            {s.count === 0 ? (
              <line
                x1={LABEL_W}
                x2={LABEL_W + barArea}
                y1={yMid}
                y2={yMid}
                stroke="var(--border)"
                strokeWidth="1"
              />
            ) : (
              <rect
                x={LABEL_W}
                y={yMid - BAR_H / 2}
                width={Math.max(w, 2)}
                height={BAR_H}
                rx={4}
                fill="var(--accent-deep)"
                opacity={0.85}
              />
            )}
            <text
              x={W - 2}
              y={yMid}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--muted)"
              fontSize="11"
            >
              {s.count === 0
                ? '—'
                : `${s.dominant ? FEELING_META[s.dominant].emoji : ''} ${s.count}× · ${
                    s.avgValence >= 0 ? '+' : ''
                  }${s.avgValence.toFixed(1)}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
