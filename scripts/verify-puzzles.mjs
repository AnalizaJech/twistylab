import { puzzles } from 'cubing/puzzles';
import { randomScrambleForEvent } from 'cubing/scramble';
let failed = false;
for (const [id, event] of [
  ['2x2x2', '222'],
  ['3x3x3', '333'],
  ['4x4x4', '444'],
  ['5x5x5', '555'],
  ['6x6x6', '666'],
  ['7x7x7', '777'],
  ['pyraminx', 'pyram'],
  ['megaminx', 'minx'],
  ['skewb', 'skewb'],
  ['square1', 'sq1'],
  ['clock', 'clock'],
  ['fto', 'fto'],
]) {
  try {
    const k = await puzzles[id].kpuzzle();
    const alg = await randomScrambleForEvent(event);
    const restored = k
      .defaultPattern()
      .applyAlg(alg)
      .applyAlg(id === 'clock' ? alg.invert().toString().replace(/y2'/g, 'y2') : alg.invert());
    if (!restored.isIdentical(k.defaultPattern())) throw Error('Inverse did not restore puzzle');
    console.log(`${id}: scramble, KPuzzle and inverse verified`);
  } catch (e) {
    failed = true;
    console.error(id, e.message);
  }
}
process.exitCode = failed ? 1 : 0;
