import { db } from './database';
import { getPuzzle, puzzleRegistry } from '../puzzles/registry';
import type { Session, Settings, Solve } from '../../types';
import type { ValueRecord } from './database';
interface Backup {
  version: 1;
  sessions: Session[];
  solves: Solve[];
  settings: ValueRecord<Settings>[];
  favorites: ValueRecord<string[]>[];
  keybindings: ValueRecord<Record<string, string>>[];
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export function validateBackup(value: unknown): Backup {
  if (
    !record(value) ||
    value.version !== 1 ||
    !['sessions', 'solves', 'settings', 'favorites', 'keybindings'].every((k) =>
      Array.isArray(value[k]),
    )
  )
    throw Error('Unsupported backup. Expected TwistyLab schema version 1.');
  const sessions = value.sessions as unknown[];
  const solves = value.solves as unknown[];
  if (
    !sessions.every(
      (s) =>
        record(s) &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Number.isFinite(s.createdAt),
    )
  )
    throw Error('Invalid session records.');
  if (
    !solves.every(
      (s) =>
        record(s) &&
        typeof s.id === 'string' &&
        typeof s.sessionId === 'string' &&
        sessions.some((x) => record(x) && x.id === s.sessionId) &&
        typeof s.puzzleId === 'string' &&
        puzzleRegistry.some((p) => p.id === s.puzzleId) &&
        typeof s.eventId === 'string' &&
        typeof s.timeMs === 'number' &&
        Number.isFinite(s.timeMs) &&
        s.timeMs >= 0 &&
        ['none', '+2', 'DNF'].includes(String(s.penalty)) &&
        typeof s.scramble === 'string' &&
        Number.isFinite(s.createdAt) &&
        (s.notes === undefined || typeof s.notes === 'string'),
    )
  )
    throw Error('Invalid solve records or missing session.');
  if (
    !(value.settings as unknown[]).every(
      (s) =>
        record(s) &&
        typeof s.id === 'string' &&
        record(s.value) &&
        ['dark', 'light', 'system'].includes(String(s.value.theme)) &&
        typeof s.value.inspection === 'boolean' &&
        [2, 3].includes(Number(s.value.precision)) &&
        typeof s.value.holdMs === 'number' &&
        s.value.holdMs >= 100 &&
        s.value.holdMs <= 3000 &&
        ['slow', 'normal', 'fast', 'instant'].includes(String(s.value.speed)) &&
        typeof s.value.charts === 'boolean',
    )
  )
    throw Error('Invalid settings.');
  if (
    !(value.favorites as unknown[]).every(
      (s) =>
        record(s) &&
        typeof s.id === 'string' &&
        Array.isArray(s.value) &&
        s.value.every((x) => typeof x === 'string' && puzzleRegistry.some((p) => p.id === x)),
    )
  )
    throw Error('Invalid favorites.');
  if (
    !(value.keybindings as unknown[]).every(
      (s) =>
        record(s) &&
        typeof s.id === 'string' &&
        record(s.value) &&
        Object.values(s.value).every((x) => typeof x === 'string'),
    )
  )
    throw Error('Invalid keybindings.');
  return value as unknown as Backup;
}
export async function exportBackup() {
  return {
    version: 1,
    sessions: await db.sessions.toArray(),
    solves: await db.solves.toArray(),
    settings: await db.settings.toArray(),
    favorites: await db.favorites.toArray(),
    keybindings: await db.keybindings.toArray(),
  };
}
export async function importBackup(value: unknown) {
  const b = validateBackup(value);
  await db.transaction('rw', db.tables, async () => {
    await db.sessions.bulkPut(b.sessions);
    await db.solves.bulkPut(b.solves);
    await db.settings.bulkPut(b.settings);
    await db.favorites.bulkPut(b.favorites);
    await db.keybindings.bulkPut(b.keybindings);
  });
}
export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCSV(solves: Solve[]) {
  const cell = (v: unknown) => `"${String(v).replaceAll('"', '""')}"`;
  download(
    'twistylab-solves.csv',
    [
      'date,puzzle,event,time,penalty,scramble',
      ...solves.map((s) =>
        [
          new Date(s.createdAt).toISOString(),
          getPuzzle(s.puzzleId).name,
          s.eventId,
          s.timeMs / 1000,
          s.penalty,
          s.scramble,
        ]
          .map(cell)
          .join(','),
      ),
    ].join('\r\n'),
    'text/csv',
  );
}
