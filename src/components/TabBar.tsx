import type { Tab } from '../types';
import { useApp } from '../state/AppContext';

const TABS: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'today', icon: '✏️', label: 'Today' },
  { tab: 'history', icon: '📅', label: 'History' },
  { tab: 'insights', icon: '📈', label: 'Insights' },
  { tab: 'settings', icon: '⚙️', label: 'Settings' },
];

export function TabBar() {
  const { state, dispatch } = useApp();
  return (
    <nav className="tabbar">
      {TABS.map(({ tab, icon, label }) => (
        <button
          key={tab}
          className={`tabbar-btn${state.tab === tab ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TAB', tab })}
          aria-current={state.tab === tab ? 'page' : undefined}
        >
          <span className="tabbar-icon" aria-hidden>
            {icon}
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
