import { describe, it, expect } from 'vitest';
import { puzzleRegistry } from '../core/puzzles/registry';
import { CubingJsPuzzleEngine } from '../engines/cubingjs/CubingJsPuzzleEngine';
describe('registered puzzle capabilities', () => {
  it.each(puzzleRegistry)(
    '$id loads and executes its move controls',
    async (puzzle) => {
      const engine = new CubingJsPuzzleEngine();
      await engine.loadPuzzle(puzzle.id);
      expect(engine.isSolved()).toBe(true);
      for (const move of puzzle.moves) {
        engine.reset();
        engine.applyMove(move);
        expect(engine.getMoveHistory()).toHaveLength(1);
      }
    },
    20000,
  );
  it('whole-cube rotations preserve solved state', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('4x4x4');
    engine.applyMove('x');
    expect(engine.isSolved()).toBe(true);
  });
  it('clock inverse y2 remains a legal self-inverse move', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('clock');
    engine.scramble('UR3+ y2 U2+');
    engine.setAlgorithm("U2- y2' UR3-");
    expect(engine.isSolved()).toBe(true);
  });
});
