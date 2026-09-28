import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Alg, Move } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';
import type { KPuzzle, KPattern } from 'cubing/kpuzzle';
import { createClock, createSquare1, disposeGroup, type SpecialModel } from './specialGeometry';
export class ThreeJsPuzzleRenderer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: SpecialModel;
  private observer: ResizeObserver;
  private kpuzzle: KPuzzle | null = null;
  private pattern: KPattern | null = null;
  private frame = 0;
  private cancelled = false;
  private generation = 0;
  private currentAlg = '';
  private setup = '';
  private queue: Move[] = [];
  private playing = false;
  speed = 1;
  private radius = 8;
  constructor(
    private host: HTMLElement,
    private puzzleId: string,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.appendChild(this.renderer.domElement);
    this.camera.position.set(4, 3, 7);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', this.render);
    this.controls.minDistance = 4;
    this.controls.maxDistance = 15;
    this.scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 6, 8);
    this.scene.add(light);
    this.model = puzzleId === 'clock' ? createClock() : createSquare1();
    this.scene.add(this.model.group);
    this.observer = new ResizeObserver(() => {
      this.renderer.setSize(host.clientWidth, host.clientHeight);
      this.camera.aspect = host.clientWidth / Math.max(1, host.clientHeight);
      this.camera.updateProjectionMatrix();
      this.render();
    });
    this.observer.observe(host);
  }
  async load() {
    this.kpuzzle = await puzzles[this.puzzleId].kpuzzle();
    if (this.cancelled) return;
    this.pattern = this.kpuzzle.defaultPattern();
    this.model.update(this.pattern);
    this.render();
  }
  private render = () => {
    if (!this.cancelled) this.renderer.render(this.scene, this.camera);
  };
  private normalize(alg: string) {
    return this.puzzleId === 'clock' ? alg.replace(/y2'/g, 'y2') : alg;
  }
  setState(setup: string, algorithm: string, animate: boolean) {
    if (!this.kpuzzle) return;
    algorithm = this.normalize(algorithm);
    setup = this.normalize(setup);
    if (setup !== this.setup || !algorithm.startsWith(this.currentAlg) || !animate) {
      this.generation++;
      cancelAnimationFrame(this.frame);
      this.queue = [];
      this.playing = false;
      this.setup = setup;
      this.currentAlg = algorithm;
      this.pattern = this.kpuzzle.defaultPattern().applyAlg(setup).applyAlg(algorithm);
      this.model.update(this.pattern);
      this.render();
      return;
    }
    const extra = algorithm.slice(this.currentAlg.length).trim();
    this.currentAlg = algorithm;
    this.queue.push(
      ...Array.from(new Alg(extra).expand().childAlgNodes()).filter(
        (n): n is Move => n instanceof Move,
      ),
    );
    void this.next();
  }
  private async next() {
    if (this.playing || !this.pattern || !this.queue.length || this.cancelled) return;
    this.playing = true;
    const move = this.queue.shift()!;
    let next: KPattern;
    try {
      next = this.pattern.applyMove(move);
    } catch {
      this.playing = false;
      this.queue = [];
      return;
    }
    const objects: THREE.Object3D[] = [];
    this.model.group.traverse((o) => objects.push(o));
    const start = objects.map((o) => ({
      position: o.position.clone(),
      quaternion: o.quaternion.clone(),
    }));
    this.model.update(next);
    const end = objects.map((o) => ({
      position: o.position.clone(),
      quaternion: o.quaternion.clone(),
    }));
    const generation = this.generation;
    const startAt = performance.now();
    const duration = 320 / this.speed;
    const tick = () => {
      if (this.cancelled || generation !== this.generation) return;
      const progress = Math.min(1, (performance.now() - startAt) / duration);
      const t = progress * progress * (3 - 2 * progress);
      objects.forEach((o, i) => {
        o.position.lerpVectors(start[i].position, end[i].position, t);
        o.quaternion.slerpQuaternions(start[i].quaternion, end[i].quaternion, t);
      });
      this.render();
      if (progress < 1) this.frame = requestAnimationFrame(tick);
      else {
        this.pattern = next;
        this.playing = false;
        void this.next();
      }
    };
    this.frame = requestAnimationFrame(tick);
  }
  preset(name: string) {
    const coords: Record<string, [number, number, number]> = {
      Front: [0, 0, 8],
      Top: [0, 8, 0.001],
      Right: [8, 0, 0],
      Isometric: [4, 3, 7],
    };
    this.camera.position.set(...coords[name]);
    this.radius = this.camera.position.length();
    this.controls.update();
    this.render();
  }
  zoom(amount: number) {
    this.radius = Math.max(4, Math.min(15, this.camera.position.length() + amount));
    this.camera.position.setLength(this.radius);
    this.controls.update();
    this.render();
  }
  dispose() {
    this.cancelled = true;
    cancelAnimationFrame(this.frame);
    this.controls.removeEventListener('change', this.render);
    this.controls.dispose();
    this.observer.disconnect();
    disposeGroup(this.model.group);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
