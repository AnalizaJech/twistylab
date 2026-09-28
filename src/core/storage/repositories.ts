import { db } from './database';
import type { Session, Settings, Solve } from '../../types';
export const SolveRepository = {
  all: () => db.solves.orderBy('createdAt').toArray(),
  save: (solve: Solve) => db.solves.put(solve),
  remove: (id: string) => db.solves.delete(id),
  update: (id: string, changes: Partial<Solve>) => db.solves.update(id, changes),
};
export const SessionRepository = {
  all: () => db.sessions.toArray(),
  save: (session: Session) => db.sessions.put(session),
};
export const SettingsRepository = {
  get: async () => (await db.settings.get('main'))?.value,
  save: (value: Settings) => db.settings.put({ id: 'main', value }),
  favorites: async () => (await db.favorites.get('main'))?.value,
  saveFavorites: (value: string[]) => db.favorites.put({ id: 'main', value }),
  bindings: async () => (await db.keybindings.get('main'))?.value,
  saveBindings: (value: Record<string, string>) => db.keybindings.put({ id: 'main', value }),
};
export async function deleteData(scope: 'session' | 'puzzle' | 'all', id: string) {
  if (scope === 'all')
    await db.transaction('rw', db.tables, async () => {
      for (const table of db.tables) await table.clear();
    });
  else if (scope === 'session')
    await db.transaction('rw', db.sessions, db.solves, async () => {
      await db.solves.where('sessionId').equals(id).delete();
      await db.sessions.delete(id);
    });
  else await db.solves.where('puzzleId').equals(id).delete();
}
