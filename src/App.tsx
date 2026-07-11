import { useApp } from './state/AppContext';
import { TabBar } from './components/TabBar';
import { TodayScreen } from './screens/TodayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export function App() {
  const { state } = useApp();
  return (
    <div className="app">
      <main className="screen">
        {state.tab === 'today' && <TodayScreen />}
        {state.tab === 'history' && <HistoryScreen />}
        {state.tab === 'insights' && <InsightsScreen />}
        {state.tab === 'settings' && <SettingsScreen />}
      </main>
      <TabBar />
    </div>
  );
}
