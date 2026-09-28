export const defaultBindings: Record<string, string> = Object.fromEntries(
  ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'x', 'y', 'z'].flatMap((m) => [
    [m.toLowerCase(), m],
    [`Shift+${m.toLowerCase()}`, `${m}'`],
    [`Alt+${m.toLowerCase()}`, `${m}2`],
  ]),
);
export const keyChord = (
  e: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'>,
) =>
  `${e.ctrlKey ? 'Ctrl+' : ''}${e.metaKey ? 'Meta+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toLowerCase()}`;
export const isTyping = (target: EventTarget | null, includeButtons = false) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    Boolean(target.closest('[role="dialog"]')) ||
    ['INPUT', 'TEXTAREA', 'SELECT', ...(includeButtons ? ['BUTTON'] : [])].includes(
      target.tagName,
    ));
