import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, Session, Solve } from '../types';
import { getPuzzle } from '../core/puzzles/registry';
import {
  SessionRepository,
  SettingsRepository,
  SolveRepository,
} from '../core/storage/repositories';
import { defaultBindings } from '../core/controls/keyboard';
import { initialTimer, transition, type TimerEvent, type TimerState } from '../core/timer/machine';
export const usePuzzleStore = create(
  persist<{
    puzzleId: string;
    eventId: string;
    recent: string[];
    select: (id: string) => void;
    setEvent: (id: string) => void;
  }>(
    (set) => ({
      puzzleId: '3x3x3',
      eventId: '333',
      recent: ['3x3x3'],
      select: (id) =>
        set((s) => ({
          puzzleId: id,
          eventId: getPuzzle(id).scrambleEventId,
          recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 6),
        })),
      setEvent: (eventId) => set({ eventId }),
    }),
    { name: 'twistylab-puzzle' },
  ),
);
export const defaultSettings: Settings = {
  locale: 'es',
  controlsVersion: 2,
  theme: 'dark',
  inspection: false,
  precision: 2,
  holdMs: 350,
  speed: 'normal',
  charts: true,
};
interface SettingsState {
  settings: Settings;
  favorites: string[];
  bindings: Record<string, string>;
  hydrate: () => Promise<void>;
  update: (p: Partial<Settings>) => Promise<void>;
  favorite: (id: string) => Promise<void>;
  setBindings: (b: Record<string, string>) => Promise<void>;
}
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  favorites: ['3x3x3', 'pyraminx', 'megaminx'],
  bindings: defaultBindings,
  hydrate: async () => {
    const [settings, favorites, bindings] = await Promise.all([
      SettingsRepository.get(),
      SettingsRepository.favorites(),
      SettingsRepository.bindings(),
    ]);
    if (bindings && settings?.controlsVersion !== 2) {
      await SettingsRepository.saveBindings({
        ...Object.fromEntries(Object.entries(defaultBindings).filter(([k]) => k.startsWith('w+'))),
        ...bindings,
      });
      await SettingsRepository.save({ ...defaultSettings, ...settings, controlsVersion: 2 });
    }
    set({
      settings: { ...defaultSettings, ...settings, controlsVersion: 2 },
      favorites: favorites ?? ['3x3x3', 'pyraminx', 'megaminx'],
      bindings: bindings
        ? settings?.controlsVersion === 2
          ? bindings
          : {
              ...Object.fromEntries(
                Object.entries(defaultBindings).filter(([k]) => k.startsWith('w+')),
              ),
              ...bindings,
            }
        : defaultBindings,
    });
  },
  update: async (p) => {
    const settings = { ...get().settings, ...p };
    await SettingsRepository.save(settings);
    set({ settings });
  },
  favorite: async (id) => {
    const favorites = get().favorites.includes(id)
      ? get().favorites.filter((x) => x !== id)
      : [...get().favorites, id];
    await SettingsRepository.saveFavorites(favorites);
    set({ favorites });
  },
  setBindings: async (bindings) => {
    await SettingsRepository.saveBindings(bindings);
    set({ bindings });
  },
}));
interface SessionState {
  sessions: Session[];
  solves: Solve[];
  sessionId: string;
  loaded: boolean;
  hydrate: () => Promise<void>;
  select: (id: string) => void;
  addSession: (name: string) => Promise<void>;
  save: (solve: Solve) => Promise<void>;
  updateSolve: (id: string, p: Partial<Solve>) => Promise<void>;
  removeSolve: (id: string) => Promise<void>;
}
export const useSessionStore = create(
  persist<SessionState>(
    (set, get) => ({
      sessions: [],
      solves: [],
      sessionId: 'default',
      loaded: false,
      hydrate: async () => {
        let sessions = await SessionRepository.all();
        if (!sessions.length) {
          const session = { id: 'default', name: 'Daily practice', createdAt: Date.now() };
          await SessionRepository.save(session);
          sessions = [session];
        }
        set({
          sessions,
          solves: await SolveRepository.all(),
          loaded: true,
          sessionId: sessions.some((s) => s.id === get().sessionId)
            ? get().sessionId
            : sessions[0].id,
        });
      },
      select: (sessionId) => set({ sessionId }),
      addSession: async (name) => {
        const session = { id: crypto.randomUUID(), name, createdAt: Date.now() };
        await SessionRepository.save(session);
        set((s) => ({ sessions: [...s.sessions, session], sessionId: session.id }));
      },
      save: async (solve) => {
        await SolveRepository.save(solve);
        set((s) => ({ solves: [...s.solves, solve] }));
      },
      updateSolve: async (id, p) => {
        await SolveRepository.update(id, p);
        set((s) => ({ solves: s.solves.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
      },
      removeSolve: async (id) => {
        await SolveRepository.remove(id);
        set((s) => ({ solves: s.solves.filter((x) => x.id !== id) }));
      },
    }),
    { name: 'twistylab-session', partialize: (s) => ({ sessionId: s.sessionId }) as SessionState },
  ),
);
export const useTimerStore = create<{
  timer: TimerState;
  send: (event: TimerEvent, now: number, inspection?: boolean) => void;
}>((set) => ({
  timer: { ...initialTimer },
  send: (event, now, inspection) =>
    set((s) => ({ timer: transition(s.timer, event, now, inspection) })),
}));
