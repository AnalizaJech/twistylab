import Dexie, { type Table } from 'dexie';
import type { Solve, Session, Settings } from '../../types';
export interface ValueRecord<T = unknown> {
  id: string;
  value: T;
}
export class TwistyDatabase extends Dexie {
  solves!: Table<Solve, string>;
  sessions!: Table<Session, string>;
  settings!: Table<ValueRecord<Settings>, string>;
  favorites!: Table<ValueRecord<string[]>, string>;
  keybindings!: Table<ValueRecord<Record<string, string>>, string>;
  constructor(name = 'twistylab') {
    super(name);
    this.version(1).stores({
      solves: 'id,sessionId,puzzleId,createdAt,[sessionId+puzzleId]',
      sessions: 'id,createdAt',
      settings: 'id',
      favorites: 'id',
      keybindings: 'id',
    });
  }
}
export const db = new TwistyDatabase();
