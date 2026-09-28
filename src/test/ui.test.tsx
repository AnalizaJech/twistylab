import { afterEach, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AlgorithmInput } from '../features/playground/PlaygroundControls';
import { useState } from 'react';
afterEach(cleanup);
describe('algorithm input', () => {
  it('accepts notation and executes on Enter', () => {
    let executed = '';
    function Harness() {
      const [value, setValue] = useState('');
      return (
        <AlgorithmInput
          value={value}
          onChange={setValue}
          onExecute={() => {
            executed = value;
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByPlaceholderText("R U R' U'");
    fireEvent.change(input, { target: { value: "R U R' U'" } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(executed).toBe("R U R' U'");
  });
});
