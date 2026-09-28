export const defaultBindings: Record<string, string> = Object.fromEntries([
  ...['R', 'L', 'U', 'D', 'F', 'B'].flatMap((m) => [
    [`w+${m.toLowerCase()}`, `${m}w`],
    [`w+Shift+${m.toLowerCase()}`, `${m}w'`],
    [`w+Alt+${m.toLowerCase()}`, `${m}w2`],
  ]),
  ...['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'x', 'y', 'z'].flatMap((m) => [
    [m.toLowerCase(), m],
    [`Shift+${m.toLowerCase()}`, `${m}'`],
    [`Alt+${m.toLowerCase()}`, `${m}2`],
  ]),
]);
export const keyChord = (
  e: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>,
) =>
  `${e.ctrlKey ? 'Ctrl+' : ''}${e.metaKey ? 'Meta+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toLowerCase()}`;
export function normalizeChord(input: string) {
  const parts = input
    .trim()
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  const key = parts.pop();
  if (
    !key ||
    parts.some((p) => !['ctrl', 'meta', 'alt', 'shift', 'w'].includes(p)) ||
    new Set(parts).size !== parts.length
  )
    throw Error('Use a key with Ctrl, Meta, Alt, Shift or the W prefix.');
  return `${parts.includes('w') ? 'w+' : ''}${['ctrl', 'meta', 'alt', 'shift']
    .filter((p) => parts.includes(p))
    .map((p) => p[0].toUpperCase() + p.slice(1) + '+')
    .join('')}${key}`;
}
export const isTyping = (target: EventTarget | null, includeButtons = false) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    Boolean(
      target.closest(
        '[role="dialog"], [role="alertdialog"], [role="listbox"], [role="combobox"], [role="option"]',
      ),
    ) ||
    ['INPUT', 'TEXTAREA', 'SELECT', ...(includeButtons ? ['BUTTON'] : [])].includes(
      target.tagName,
    ));
