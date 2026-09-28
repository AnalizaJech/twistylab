import { CubingJsPuzzleEngine } from '../../engines/cubingjs/CubingJsPuzzleEngine';
export interface PuzzleSnapshot {
  history: string[];
  setup: string;
  solved: boolean;
  canRedo: boolean;
  revision: number;
}
export class InteractivePuzzleController {
  readonly engine = new CubingJsPuzzleEngine();
  private revision = 0;
  snapshot(): PuzzleSnapshot {
    return {
      history: this.engine.getMoveHistory(),
      setup: this.engine.getSetup(),
      solved: this.engine.isSolved(),
      canRedo: this.engine.canRedo(),
      revision: ++this.revision,
    };
  }
  async load(id: string) {
    await this.engine.loadPuzzle(id);
    return this.snapshot();
  }
  execute(alg: string) {
    this.engine.setAlgorithm(alg);
    return this.snapshot();
  }
  undo() {
    this.engine.undo();
    return this.snapshot();
  }
  redo() {
    this.engine.redo();
    return this.snapshot();
  }
  reset() {
    this.engine.reset();
    return this.snapshot();
  }
  scramble(alg: string) {
    this.engine.scramble(alg);
    return this.snapshot();
  }
}
