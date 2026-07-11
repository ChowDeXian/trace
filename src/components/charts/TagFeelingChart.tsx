import type { TagFeelingStat } from '../../lib/insights';
import { FEELINGS } from '../../types';
import { FEELING_META } from '../../lib/feelings';

interface Props {
  stats: TagFeelingStat[]; // sorted by total desc
  maxTags?: number;
}

const W = 320;
const ROW_H = 28;
const BAR_H = 14;
const LABEL_W = 88;

export function TagFeelingChart({ stats, maxTags = 6 }: Props) {
  const rows = stats.slice(0, maxTags);
  if (rows.length === 0) {
    return <div className="empty-hint">Tag a few more entries to see which feelings go with each tag.</div>;
  }

  const barArea = W - LABEL_W;
  const height = rows.length * ROW_H;

  return (
    <div>
      <div className="feeling-legend">
        {FEELINGS.map((f) => (
          <span key={f}>
            <i style={{ background: FEELING_META[f].color }} />
            {FEELING_META[f].emoji} {FEELING_META[f].label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label="Feelings by tag">
        {rows.map((s, i) => {
          const yMid = i * ROW_H + ROW_H / 2;
          let xCursor = LABEL_W;
          return (
            <g key={s.tagId}>
              <text
                x={LABEL_W - 8}
                y={yMid}
                textAnchor="end"
                dominantBaseline="central"
                fill="var(--text)"
                fontSize="12"
                fontWeight="600"
              >
                {s.name}
              </text>
              {FEELINGS.map((f) => {
                const count = s.counts[f];
                if (count === 0) return null;
                const w = (count / s.total) * barArea - 2;
                const x = xCursor;
                xCursor += w + 2;
                return (
                  <rect
                    key={f}
                    x={x}
                    y={yMid - BAR_H / 2}
                    width={Math.max(w, 1)}
                    height={BAR_H}
                    rx={3}
                    fill={FEELING_META[f].color}
                    opacity={0.9}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
