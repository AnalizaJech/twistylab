import { randomScrambleForEvent } from 'cubing/scramble';
export async function generateScramble(eventId: string) {
  return (await randomScrambleForEvent(eventId)).toString();
}
