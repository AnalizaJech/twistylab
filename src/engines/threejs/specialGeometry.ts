import * as THREE from 'three';
import type { KPattern } from 'cubing/kpuzzle';
const material = (color: number) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.04 });
export interface SpecialModel {
  group: THREE.Group;
  update: (pattern: KPattern) => void;
}
/** Build Redi's 20 pieces from cubing.js's labeled, oriented sticker net. */
export function createRediCube(svg: string): SpecialModel {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2.92, 2.92, 2.92), material(0x111111)));
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const normals: Record<string, THREE.Vector3> = {
    '#FFFFFF': new THREE.Vector3(0, 1, 0),
    '#FFFF00': new THREE.Vector3(0, -1, 0),
    '#FF0000': new THREE.Vector3(1, 0, 0),
    '#FF8000': new THREE.Vector3(-1, 0, 0),
    '#FFA500': new THREE.Vector3(-1, 0, 0),
    '#32CD32': new THREE.Vector3(0, 0, 1),
    '#2266FF': new THREE.Vector3(0, 0, -1),
  };
  const colors: Record<string, string[][]> = { CORNERS: [], EDGES: [] };
  for (const node of document.querySelectorAll('[id]')) {
    const match = /^(CORNERS|EDGES)-l(\d+)-o(\d+)$/.exec(node.id);
    if (!match) continue;
    const color = /fill:\s*(#[a-f\d]{6})/i
      .exec(node.getAttribute('style') ?? '')?.[1]
      .toUpperCase();
    if (!color || !normals[color]) throw Error('Unsupported Redi sticker color.');
    (colors[match[1]][Number(match[2])] ??= [])[Number(match[3])] = color;
  }
  const stickers: {
    orbit: string;
    location: number;
    orientation: number;
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  }[] = [];
  for (const [orbit, pieces] of Object.entries(colors)) {
    pieces.forEach((piece, location) => {
      const center = piece.reduce((v, color) => v.add(normals[color]), new THREE.Vector3());
      const plastic = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.96, 0.96), material(0x111111));
      plastic.position.copy(center);
      group.add(plastic);
      piece.forEach((color, orientation) => {
        const normal = normals[color];
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.85, 0.85),
          material(Number(color.replace('#', '0x'))),
        );
        mesh.position.copy(center).addScaledVector(normal, 0.485);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        group.add(mesh);
        stickers.push({ orbit, location, orientation, mesh });
      });
    });
  }
  return {
    group,
    update: (pattern) => {
      for (const sticker of stickers) {
        const orbit = pattern.patternData[sticker.orbit];
        const piece = colors[sticker.orbit][orbit.pieces[sticker.location]];
        const index =
          (sticker.orientation - orbit.orientation[sticker.location] + piece.length) % piece.length;
        sticker.mesh.material.color.set(piece[index]);
      }
    },
  };
}
export function createClock(): SpecialModel {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 0.36), material(0x216a9f));
  group.add(frame);
  const hands: THREE.Group[] = [];
  for (let side = 0; side < 2; side++) {
    const board = new THREE.Group();
    board.rotation.y = side * Math.PI;
    board.position.z = side ? -0.19 : 0.19;
    group.add(board);
    for (let i = 0; i < 9; i++) {
      const dial = new THREE.Group();
      dial.position.set(((i % 3) - 1) * 1.04, (1 - Math.floor(i / 3)) * 1.04, 0.025);
      board.add(dial);
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(0.43, 40),
        material(side ? 0x092b43 : 0xd8ecf0),
      );
      dial.add(face);
      for (let hour = 0; hour < 12; hour++) {
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.065, 0.01),
          material(side ? 0xcbe1e9 : 0x214b67),
        );
        const a = (hour * Math.PI) / 6;
        tick.position.set(Math.sin(a) * 0.35, Math.cos(a) * 0.35, 0.008);
        tick.rotation.z = -a;
        dial.add(tick);
      }
      const hand = new THREE.Group();
      hand.position.z = 0.025;
      const needle = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.3, 0.026),
        material(side ? 0xffca63 : 0xc34338),
      );
      needle.position.y = 0.13;
      hand.add(needle);
      dial.add(hand);
      hands.push(hand);
      const axle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), material(0xf6c85f));
      axle.position.z = 0.03;
      dial.add(axle);
    }
    for (const x of [-0.52, 0.52])
      for (const y of [-0.52, 0.52]) {
        const pin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16),
          material(0xffd072),
        );
        pin.rotation.x = Math.PI / 2;
        pin.position.set(x, y, 0.06);
        board.add(pin);
      }
  }
  return {
    group,
    update: (pattern) => {
      const d = pattern.patternData.DIALS;
      for (let i = 0; i < 18; i++) hands[i].rotation.z = (-d.orientation[i] * Math.PI) / 6;
      group.rotation.y = pattern.patternData.FRAME.orientation[0] * Math.PI;
    },
  };
}
function radial(angle: number) {
  const r = 1.5 / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
  return new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
}
export function createSquare1(): SpecialModel {
  const group = new THREE.Group();
  const wedges: THREE.Mesh[] = [];
  const colors = [0xd64036, 0x2475df, 0xff9b28, 0x3daa66];
  for (let i = 0; i < 24; i++) {
    const slot = i % 12;
    const a = ((15 + slot * 30) * Math.PI) / 180;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    const p1 = radial(a + 0.004);
    shape.lineTo(p1.x, p1.y);
    for (let j = 1; j <= 8; j++) {
      const p = radial(a + ((Math.PI / 6 - 0.008) * j) / 8 + 0.004);
      shape.lineTo(p.x, p.y);
    }
    shape.lineTo(0, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.91, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.455, 0);
    const wedge = new THREE.Mesh(geometry, [
      material(i < 12 ? 0xf5f6f0 : 0xffe746),
      material(colors[Math.floor(slot / 3)]),
    ]);
    wedges.push(wedge);
    group.add(wedge);
  }
  const halves = [
    new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.47, 2.98), material(0xd64036)),
    new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.47, 2.98), material(0x2475df)),
  ];
  halves[0].position.x = -0.75;
  halves[1].position.x = 0.75;
  group.add(...halves);
  return {
    group,
    update: (pattern) => {
      const data = pattern.patternData.WEDGES;
      for (let slot = 0; slot < 24; slot++) {
        const piece = data.pieces[slot];
        const mesh = wedges[piece];
        const angle = (((slot % 12) - (piece % 12)) * Math.PI) / 6;
        mesh.position.y = slot < 12 ? 0.72 : -0.72;
        mesh.rotation.y = -angle;
        mesh.rotation.z = 0;
      }
      halves[1].rotation.x = ((pattern.patternData.EQUATOR.orientation[1] % 6) * Math.PI) / 3;
    },
  };
}
export function disposeGroup(group: THREE.Group) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of materials) m.dispose();
    }
  });
}
