import { describe, it, expect } from 'vitest';
import { CubingJsPuzzleEngine } from '../engines/cubingjs/CubingJsPuzzleEngine';
import { keyChord, defaultBindings } from '../core/controls/keyboard';
describe('puzzle controller state', () => {
  it('tracks history with undo and redo', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('3x3x3');
    engine.setAlgorithm("R U R' U'");
    expect(engine.getMoveHistory()).toEqual(['R', 'U', "R'", "U'"]);
    expect(engine.isSolved()).toBe(false);
    engine.undo();
    expect(engine.getMoveHistory()).toHaveLength(3);
    engine.redo();
    expect(engine.getMoveHistory()).toHaveLength(4);
    engine.reset();
    expect(engine.isSolved()).toBe(true);
  });
  it('detects an inverse solve and keeps scramble separate', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('3x3x3');
    engine.scramble('R U');
    expect(engine.getMoveHistory()).toEqual([]);
    engine.setAlgorithm("U' R'");
    expect(engine.isSolved()).toBe(true);
  });
  it('invalid moves leave history and state unchanged', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('3x3x3');
    expect(() => engine.setAlgorithm('NOTAMOVE')).toThrow();
    expect(engine.getMoveHistory()).toEqual([]);
    expect(engine.isSolved()).toBe(true);
  });
  it('new moves discard redo', async () => {
    const engine = new CubingJsPuzzleEngine();
    await engine.loadPuzzle('2x2x2');
    engine.applyMove('R');
    engine.undo();
    engine.applyMove('U');
    engine.redo();
    expect(engine.getMoveHistory()).toEqual(['U']);
  });
  it('maps inverse and double keyboard moves', () => {
    const base = { key: 'R', shiftKey: false, altKey: false, ctrlKey: false, metaKey: false };
    expect(defaultBindings[keyChord(base)]).toBe('R');
    expect(defaultBindings[keyChord({ ...base, shiftKey: true })]).toBe("R'");
    expect(defaultBindings[keyChord({ ...base, altKey: true })]).toBe('R2');
  });
});
