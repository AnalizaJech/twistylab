import { useSessionStore, usePuzzleStore } from '../stores';
export function useSolves() {
  const { solves, sessionId } = useSessionStore();
  const { puzzleId, eventId } = usePuzzleStore();
  return solves.filter(
    (s) => s.sessionId === sessionId && s.puzzleId === puzzleId && s.eventId === eventId,
  );
}
