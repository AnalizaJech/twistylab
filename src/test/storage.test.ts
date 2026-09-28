import { afterEach, describe, it, expect } from 'vitest';
import { db, TwistyDatabase } from '../core/storage/database';
import { SolveRepository, SessionRepository } from '../core/storage/repositories';
import { exportBackup, importBackup, validateBackup } from '../core/storage/backup';
import type { Solve } from '../types';
const solve: Solve = {
  id: 'test-solve',
  sessionId: 'test-session',
  puzzleId: '3x3x3',
  eventId: '333',
  timeMs: 12345,
  penalty: 'none',
  scramble: 'R U',
  createdAt: 1,
};
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
describe('local persistence', () => {
  it('persists sessions and solves across database instances', async () => {
    await SessionRepository.save({ id: 'test-session', name: 'Training', createdAt: 1 });
    await SolveRepository.save(solve);
    const reopened = new TwistyDatabase();
    expect((await reopened.sessions.get('test-session'))?.name).toBe('Training');
    expect(await reopened.solves.get(solve.id)).toEqual(solve);
    reopened.close();
  });
  it('updates penalties and removes records', async () => {
    await SolveRepository.save(solve);
    await SolveRepository.update(solve.id, { penalty: '+2' });
    expect((await SolveRepository.all())[0].penalty).toBe('+2');
    await SolveRepository.remove(solve.id);
    expect(await SolveRepository.all()).toEqual([]);
  });
  it('roundtrips a backup', async () => {
    await SessionRepository.save({ id: 'test-session', name: 'Training', createdAt: 1 });
    await SolveRepository.save(solve);
    const b = await exportBackup();
    await db.solves.clear();
    await importBackup(b);
    expect(await SolveRepository.all()).toEqual([solve]);
  });
  it('rejects incompatible schemas and corrupted solve times', () => {
    expect(() => validateBackup({ version: 2 })).toThrow();
    expect(() =>
      validateBackup({
        version: 1,
        sessions: [],
        solves: [{ ...solve, timeMs: -1 }],
        settings: [],
        favorites: [],
        keybindings: [],
      }),
    ).toThrow();
  });
});
