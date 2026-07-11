import { FEELINGS, type Feeling, type Intensity } from '../types';
import { FEELING_META, INTENSITY_VALUES } from '../lib/feelings';

interface Props {
  feeling: Feeling | null;
  intensity: Intensity;
  onFeelingChange: (feeling: Feeling) => void;
  onIntensityChange: (intensity: Intensity) => void;
}

/** 32 = 0x51/255 alpha suffix for the filled intensity segments. */
const FILL_ALPHA = '51';

export function FeelingPicker({ feeling, intensity, onFeelingChange, onIntensityChange }: Props) {
  const meta = feeling ? FEELING_META[feeling] : null;

  return (
    <div>
      <div className="feeling-grid" role="radiogroup" aria-label="Feeling">
        {FEELINGS.map((f) => {
          const m = FEELING_META[f];
          const selected = feeling === f;
          return (
            <button
              key={f}
              className={`feeling-btn${selected ? ' selected' : ''}`}
              style={selected ? { borderColor: m.color } : undefined}
              onClick={() => onFeelingChange(f)}
              role="radio"
              aria-checked={selected}
              aria-label={m.label}
            >
              {m.emoji}
              <span className="feeling-label" style={selected ? { color: m.color } : undefined}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className={`intensity-picker${meta ? '' : ' disabled'}`}>
        <div className="intensity-header">
          <span>Intensity</span>
          <span style={meta ? { color: meta.color } : undefined}>
            {meta ? `${intensity}/10` : '—'}
          </span>
        </div>
        <div className="intensity-seg" role="radiogroup" aria-label="Intensity">
          {INTENSITY_VALUES.map((n) => {
            const filled = meta !== null && n <= intensity;
            return (
              <button
                key={n}
                disabled={meta === null}
                onClick={() => onIntensityChange(n)}
                role="radio"
                aria-checked={n === intensity}
                aria-label={`${n} out of 10`}
                style={
                  filled && meta
                    ? { background: meta.color + FILL_ALPHA, borderTopColor: meta.color }
                    : undefined
                }
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
