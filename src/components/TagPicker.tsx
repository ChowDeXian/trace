import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { newId } from '../lib/id';

interface Props {
  selected: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selected, onChange }: Props) {
  const { state, dispatch } = useApp();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  const commitDraft = () => {
    const name = draft.trim().toLowerCase();
    setDraft('');
    setAdding(false);
    if (!name) return;
    const existing = state.tags.find((t) => t.name.toLowerCase() === name);
    if (existing) {
      if (!selected.includes(existing.id)) onChange([...selected, existing.id]);
      return;
    }
    const tag = { id: newId(), name, builtin: false };
    dispatch({ type: 'ADD_TAG', tag });
    onChange([...selected, tag.id]);
  };

  return (
    <div className="chip-row">
      {state.tags.map((tag) => (
        <button
          key={tag.id}
          className={`chip${selected.includes(tag.id) ? ' selected' : ''}`}
          onClick={() => toggle(tag.id)}
          aria-pressed={selected.includes(tag.id)}
        >
          {tag.name}
        </button>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
          placeholder="new tag"
          style={{ width: 120, padding: '6px 10px', borderRadius: 999, fontSize: 13 }}
        />
      ) : (
        <button className="chip" onClick={() => setAdding(true)}>
          ＋ tag
        </button>
      )}
    </div>
  );
}
