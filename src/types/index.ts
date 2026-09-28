export type Penalty = 'none' | '+2' | 'DNF';
export interface Solve {
  id: string;
  sessionId: string;
  puzzleId: string;
  eventId: string;
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  createdAt: number;
  notes?: string;
  source?: 'timer' | 'virtual';
  moves?: number;
}
export interface Session {
  id: string;
  name: string;
  createdAt: number;
}
export interface Settings {
  locale: 'es' | 'en';
  controlsVersion?: number;
  theme: 'dark' | 'light' | 'system';
  inspection: boolean;
  precision: 2 | 3;
  holdMs: number;
  speed: 'slow' | 'normal' | 'fast' | 'instant';
  charts: boolean;
}
export interface CompetitionMode {
  id: string;
  name: string;
  puzzleId: string;
  scrambleEventId: string;
}
export interface PuzzleDefinition {
  id: string;
  name: string;
  shortName: string;
  family: string;
  category: string;
  officialWCA: boolean;
  legacyWCA?: boolean;
  wcaEventId?: string;
  cubingPuzzleId: string;
  scrambleEventId: string;
  renderer: 'cubing' | 'special';
  supports3D: boolean;
  supportsScramble: boolean;
  supportsInteractiveMoves: boolean;
  supportsVirtualSolve: boolean;
  moves: string[];
  defaultCamera?: string;
}
