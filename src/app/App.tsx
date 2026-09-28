import { WorkspaceBoundary } from '../components/WorkspaceBoundary';
import { useI18n } from '../i18n';
import { Select } from '../components/Select';
import { ConfirmationProvider } from '../components/Confirmation';
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
  Languages,
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
  const { t } = useI18n();
  return (
    <nav className="navigation-tabs" aria-label={t('Main navigation')}>
      {[
        { path: 'timer', icon: Timer, label: 'Timer' },
        { path: 'playground', icon: Orbit, label: 'Playground' },
        { path: 'stats', icon: ChartNoAxesCombined, label: 'Stats' },
      ].map(({ path, icon: Icon, label }) => (
        <NavLink key={path} to={`/${path}`}>
          <Icon size={16} />
          {t(label)}
        </NavLink>
      ))}
    </nav>
  );
}
export function AppShell() {
  const { t } = useI18n();
  const { puzzleId, eventId, setEvent } = usePuzzleStore();
  const { settings, update } = useSettingsStore();
  const [error, setError] = useState('');
  const location = useLocation();
  useEffect(() => {
    document.documentElement.lang = settings.locale;
  }, [settings.locale]);
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
            {t('twisty')}
            <span>{t('lab')}</span>
          </span>
          <small>{t('BETA 1.0')}</small>
        </a>
        <div className="header-controls">
          <PuzzleSelector />
          <Select
            className="mode-select"
            label={t('Competition mode')}
            value={eventId}
            onValueChange={setEvent}
            options={modes
              .filter((m) => m.puzzleId === puzzleId)
              .map((m) => ({ value: m.id, label: m.name }))}
          />
          <button
            className="language-button"
            aria-label={t('Change language')}
            onClick={() => void update({ locale: settings.locale === 'es' ? 'en' : 'es' })}
          >
            <Languages size={16} />
            <span>{settings.locale.toUpperCase()}</span>
          </button>
          <NavLink className="icon-button" to="/settings" aria-label={t('Settings')}>
            <Settings size={19} />
          </NavLink>
        </div>
      </header>
      <div className="navigation-row">
        <NavigationTabs />
        <nav className="secondary-nav" aria-label={t('Secondary navigation')}>
          <NavLink to="/history">
            <History size={16} />
            {t('History')}
          </NavLink>
          <NavLink to="/settings">
            <Settings size={16} />
            {t('Settings')}
          </NavLink>
        </nav>
      </div>
      {error && (
        <p className="error" role="alert">
          {t(error)}
        </p>
      )}
      <div className="page-content" key={location.pathname}>
        <Suspense fallback={<div className="empty">{t('Loading workspace…')}</div>}>
          <WorkspaceBoundary>
            <Routes>
              <Route path="/timer" element={<TimerPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/timer" replace />} />
            </Routes>
          </WorkspaceBoundary>
        </Suspense>
      </div>
      <div className="app-footer">
        <span>
          {t('TWISTYLAB')}
          <span>{t('/')}</span>
          {t('PRACTICE WITH PRECISION')}
        </span>
        <a href="https://js.cubing.net/" target="_blank" rel="noreferrer">
          {t('Powered by cubing.js')}
          <ArrowUpRight size={12} />
        </a>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <HashRouter>
      <ConfirmationProvider>
        <AppShell />
      </ConfirmationProvider>
    </HashRouter>
  );
}
