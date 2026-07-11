import type { MoodValue } from '../types';
import { MOODS, MOOD_VALUES } from '../lib/mood';

interface Props {
  value: MoodValue | null;
  onChange: (mood: MoodValue) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="mood-picker" role="radiogroup" aria-label="Mood">
      {MOOD_VALUES.map((m) => {
        const meta = MOODS[m];
        const selected = value === m;
        return (
          <button
            key={m}
            className={`mood-btn${selected ? ' selected' : ''}`}
            style={selected ? { borderColor: meta.color } : undefined}
            onClick={() => onChange(m)}
            role="radio"
            aria-checked={selected}
            aria-label={meta.label}
          >
            {meta.emoji}
            <span className="mood-label" style={selected ? { color: meta.color } : undefined}>
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
