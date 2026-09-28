import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { puzzles } from 'cubing/puzzles';
import { NumberStepper } from '../components/NumberStepper';
import { defaultBindings, isTyping, keyChord, normalizeChord } from '../core/controls/keyboard';
import { CubingJsPuzzleEngine } from '../engines/cubingjs/CubingJsPuzzleEngine';
import { createRediCube, disposeGroup } from '../engines/threejs/specialGeometry';
import { translate } from '../i18n';
import * as THREE from 'three';

afterEach(cleanup);
describe('wide controls and shared interface', () => {
  it('normalizes modifier order for custom wide shortcuts', () => {
    expect(normalizeChord(' Shift + W + Alt + R ')).toBe('w+Alt+Shift+r');
    expect(normalizeChord('shift+alt+r')).toBe('Alt+Shift+r');
    expect(() => normalizeChord('wide+r')).toThrow();
  });
  it.each(['R', 'L', 'U', 'D', 'F', 'B'])(
    'supports %sw, inverse and double keyboard bindings',
    async (face) => {
      const event = { key: face, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false };
      expect(defaultBindings[`w+${keyChord(event)}`]).toBe(`${face}w`);
      expect(defaultBindings[`w+${keyChord({ ...event, shiftKey: true })}`]).toBe(`${face}w'`);
      expect(defaultBindings[`w+${keyChord({ ...event, altKey: true })}`]).toBe(`${face}w2`);
      const engine = new CubingJsPuzzleEngine();
      await engine.loadPuzzle('3x3x3');
      engine.applyMove(`${face}w`);
      expect(engine.isSolved()).toBe(false);
      engine.applyMove(`${face}w'`);
      expect(engine.isSolved()).toBe(true);
    },
  );
  it('does not dispatch puzzle shortcuts while a custom dropdown has focus', () => {
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    expect(isTyping(option)).toBe(true);
  });
  it('translates interface labels and preserves notation', () => {
    expect(translate('Playground', 'es')).toBe('Laboratorio');
    expect(translate('Playground', 'en')).toBe('Playground');
    expect(translate("Rw'", 'es')).toBe("Rw'");
  });
  it('allows editing a number before validating its bounds', () => {
    function Harness() {
      const [value, setValue] = useState(350);
      return (
        <NumberStepper
          label="Hold duration"
          value={value}
          onChange={setValue}
          min={100}
          max={3000}
          step={50}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).toHaveValue('1');
    fireEvent.blur(input);
    expect(input).toHaveValue('100');
    fireEvent.change(input, { target: { value: 'oops' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('100');
  });
  it('Redi 3D uses all 48 oriented stickers and restores colors after an inverse', async () => {
    const loader = puzzles.redi_cube;
    const kp = await loader.kpuzzle();
    const model = createRediCube(await loader.svg());
    const colors = () => {
      const result: string[] = [];
      model.group.traverse((node) => {
        if (node instanceof THREE.Mesh && node.geometry instanceof THREE.PlaneGeometry)
          result.push(node.material.color.getHexString());
      });
      return result;
    };
    model.update(kp.defaultPattern());
    const before = colors();
    expect(before).toHaveLength(48);
    model.update(kp.defaultPattern().applyAlg('F'));
    expect(colors()).not.toEqual(before);
    model.update(kp.defaultPattern().applyAlg("F F'"));
    expect(colors()).toEqual(before);
    disposeGroup(model.group);
  });
});
