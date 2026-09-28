import { lazy, Suspense, useEffect, useState } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  Box,
  Timer,
  Orbit,
  ChartNoAxesCombined,
  History,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { PuzzleSelector } from '../components/PuzzleSelector';
import { usePuzzleStore, useSettingsStore, useSessionStore } from '../stores';
import { modes } from '../core/puzzles/registry';
const TimerPage = lazy(() => import('../features/timer/TimerPage'));
const PlaygroundPage = lazy(() => import('../features/playground/PlaygroundPage'));
const StatsPage = lazy(() => import('../features/stats/StatsPage'));
const HistoryPage = lazy(() => import('../features/history/HistoryPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
export function NavigationTabs() {
  return (
    <nav className="navigation-tabs" aria-label="Main navigation">
      {[
        { path: 'timer', icon: Timer, label: 'Timer' },
        { path: 'playground', icon: Orbit, label: 'Playground' },
        { path: 'stats', icon: ChartNoAxesCombined, label: 'Stats' },
      ].map(({ path, icon: Icon, label }) => (
        <NavLink key={path} to={`/${path}`}>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
export function AppShell() {
  const { puzzleId, eventId, setEvent } = usePuzzleStore();
  const { settings } = useSettingsStore();
  const [error, setError] = useState('');
  const location = useLocation();
  useEffect(() => {
    Promise.all([
      useSessionStore.getState().hydrate(),
      useSettingsStore.getState().hydrate(),
    ]).catch(() =>
      setError('Browser storage is unavailable. Enable IndexedDB to save your solves.'),
    );
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      (document.documentElement.dataset.theme =
        settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#/timer">
          <Box size={27} />
          <span>
            twisty<span>lab</span>
          </span>
          <small>BETA 1.0</small>
        </a>
        <div className="header-controls">
          <PuzzleSelector />
          <select
            className="mode-select"
            aria-label="Competition mode"
            value={eventId}
            onChange={(e) => setEvent(e.target.value)}
          >
            {modes
              .filter((m) => m.puzzleId === puzzleId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
          <NavLink className="icon-button" to="/settings" aria-label="Settings">
            <Settings size={19} />
          </NavLink>
        </div>
      </header>
      <div className="navigation-row">
        <NavigationTabs />
        <nav className="secondary-nav" aria-label="Secondary navigation">
          <NavLink to="/history">
            <History size={16} />
            History
          </NavLink>
          <NavLink to="/settings">
            <Settings size={16} />
            Settings
          </NavLink>
        </nav>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="page-content" key={location.pathname}>
        <Suspense fallback={<div className="empty">Loading workspace…</div>}>
          <Routes>
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/timer" replace />} />
          </Routes>
        </Suspense>
      </div>
      <div className="app-footer">
        <span>
          TWISTYLAB <span> / </span> PRACTICE WITH PRECISION
        </span>
        <a href="https://js.cubing.net/" target="_blank" rel="noreferrer">
          Powered by cubing.js <ArrowUpRight size={12} />
        </a>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
