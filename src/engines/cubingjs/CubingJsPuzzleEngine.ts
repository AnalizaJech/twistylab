import { Alg, Move, Grouping } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import type { KPuzzle, KPattern } from 'cubing/kpuzzle';
import { getPuzzle } from '../../core/puzzles/registry';
export interface PuzzleEngine {
  loadPuzzle(id: string): Promise<void>;
  setAlgorithm(alg: string): void;
  applyMove(move: string): void;
  reset(): void;
  scramble(alg: string): void;
  isSolved(): boolean;
  undo(): void;
  redo(): void;
  getMoveHistory(): string[];
}
export class CubingJsPuzzleEngine implements PuzzleEngine {
  private kpuzzle: KPuzzle | null = null;
  private pattern: KPattern | null = null;
  private history: string[] = [];
  private redoStack: string[] = [];
  private setup = '';
  private puzzleId = '';
  async loadPuzzle(id: string) {
    this.puzzleId = id;
    const loader = puzzles[getPuzzle(id).cubingPuzzleId];
    if (!loader) throw Error('Puzzle model unavailable.');
    this.kpuzzle = await loader.kpuzzle();
    this.reset();
  }
  private refresh(history = this.history, setup = this.setup) {
    if (!this.kpuzzle) throw Error('Puzzle is loading.');
    return this.kpuzzle
      .defaultPattern()
      .applyAlg(this.normalize(setup))
      .applyAlg(this.normalize(history.join(' ')));
  }
  setAlgorithm(alg: string) {
    const parsed = new Alg(this.normalize(alg));
    const next = Array.from(
      (this.puzzleId === 'square1' ? parsed : parsed.expand()).childAlgNodes(),
    )
      .filter((n) => n instanceof Move || (this.puzzleId === 'square1' && n instanceof Grouping))
      .map((n) => n.toString());
    const pattern = this.refresh([...this.history, ...next]);
    this.history.push(...next);
    this.redoStack = [];
    this.pattern = pattern;
  }
  applyMove(move: string) {
    this.setAlgorithm(move);
  }
  reset() {
    this.history = [];
    this.redoStack = [];
    this.setup = '';
    this.pattern = this.kpuzzle?.defaultPattern() ?? null;
  }
  scramble(alg: string) {
    const pattern = this.refresh([], alg);
    this.setup = alg;
    this.history = [];
    this.redoStack = [];
    this.pattern = pattern;
  }
  private normalize(alg: string) {
    return this.puzzleId === 'clock' ? alg.replace(/y2'/g, 'y2') : alg;
  }
  isSolved() {
    if (!this.pattern || !this.kpuzzle) return false;
    if (this.puzzleId === 'clock')
      return this.pattern.patternData.DIALS.orientation.every((n) => n === 0);
    try {
      return this.pattern.experimentalIsSolved({
        ignorePuzzleOrientation: true,
        ignoreCenterOrientation: true,
      });
    } catch {
      return this.pattern.isIdentical(this.kpuzzle.defaultPattern());
    }
  }
  undo() {
    const last = this.history.at(-1);
    if (last) {
      this.history.pop();
      this.redoStack.push(last);
      this.pattern = this.refresh();
    }
  }
  redo() {
    const last = this.redoStack.pop();
    if (last) {
      this.history.push(last);
      this.pattern = this.refresh();
    }
  }
  getMoveHistory() {
    return [...this.history];
  }
  getSetup() {
    return this.setup;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }
  validate(alg: string) {
    this.refresh([], alg);
  }
}
