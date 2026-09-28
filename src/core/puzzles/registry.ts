import type { CompetitionMode, PuzzleDefinition } from '../../types';
export const categories = [
  'WCA',
  'NxNxN',
  'Minx',
  'Pyramidal',
  'Shape Mods',
  'Cuboids',
  'Corner Turning',
  'Edge Turning',
  'Experimental',
  'Legacy',
];
const cubeMoves = ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'x', 'y', 'z', 'Rw', 'Uw'];
const define = (
  id: string,
  name: string,
  shortName: string,
  category: string,
  event: string,
  moves: string[],
  officialWCA = true,
): PuzzleDefinition => ({
  id,
  name,
  shortName,
  family: category,
  category,
  officialWCA,
  cubingPuzzleId: id,
  scrambleEventId: event,
  wcaEventId: officialWCA ? event : undefined,
  renderer: ['clock', 'square1'].includes(id) ? 'special' : 'cubing',
  supports3D: true,
  supportsScramble: true,
  supportsInteractiveMoves: true,
  supportsVirtualSolve: true,
  moves,
  defaultCamera: 'isometric',
});
export const puzzleRegistry: PuzzleDefinition[] = [
  ...Array.from({ length: 6 }, (_, i) => {
    const n = i + 2;
    return define(
      `${n}x${n}x${n}`,
      `${n} × ${n} × ${n}`,
      `${n}×${n}`,
      'NxNxN',
      `${n}${n}${n}`,
      n === 2
        ? ['R', 'U', 'F', 'L', 'D', 'B', 'x', 'y', 'z']
        : n % 2 === 0
          ? cubeMoves.filter((m) => !['M', 'E', 'S'].includes(m))
          : cubeMoves,
    );
  }),
  define('pyraminx', 'Pyraminx', 'Pyraminx', 'Pyramidal', 'pyram', [
    'R',
    'L',
    'U',
    'B',
    'r',
    'l',
    'u',
    'b',
  ]),
  define('megaminx', 'Megaminx', 'Megaminx', 'Minx', 'minx', ['R', 'U', 'D', 'L', 'F', 'BR', 'BL']),
  define('skewb', 'Skewb', 'Skewb', 'Corner Turning', 'skewb', ['R', 'L', 'U', 'B']),
  define('square1', 'Square-1', 'Square-1', 'Experimental', 'sq1', ['(1, 0)', '(0, 1)', '/']),
  define('clock', 'Clock', 'Clock', 'Experimental', 'clock', [
    'UR1+',
    'UL1+',
    'U1+',
    'R1+',
    'L1+',
    'D1+',
    'ALL1+',
    'y2',
  ]),
  define(
    'fto',
    'Face Turning Octahedron',
    'FTO',
    'Experimental',
    'fto',
    ['U', 'F', 'R', 'L', 'D', 'B', 'BR', 'BL'],
    false,
  ),
];
export const getPuzzle = (id: string) =>
  puzzleRegistry.find((p) => p.id === id) ?? puzzleRegistry[1];
export const modes: CompetitionMode[] = [
  ...puzzleRegistry.map((p) => ({
    id: p.scrambleEventId,
    name: 'Standard',
    puzzleId: p.id,
    scrambleEventId: p.scrambleEventId,
  })),
  ...(['333oh', '333bf', '333fm', '333mbf'] as const).map((id, i) => ({
    id,
    name: ['One-handed', 'Blindfolded', 'Fewest moves', 'Multi-blind'][i],
    puzzleId: '3x3x3',
    scrambleEventId: id,
  })),
  { id: '444bf', name: 'Blindfolded', puzzleId: '4x4x4', scrambleEventId: '444bf' },
  { id: '555bf', name: 'Blindfolded', puzzleId: '5x5x5', scrambleEventId: '555bf' },
];
