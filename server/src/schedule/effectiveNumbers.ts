import type { AllowedNumber } from '../db/allowedNumbers.repo';
import type { ScheduleSettings } from './schedule.repo';
import { isWithinWindow } from './clock';

export type Direction = 'incoming' | 'outgoing';

/**
 * The numbers that should actually be allowed for a direction right now:
 * the full whitelist if that direction's schedule is off or we're inside
 * its active window, otherwise only numbers flagged always_allowed.
 */
export function computeEffectiveNumbers(
  direction: Direction,
  settings: ScheduleSettings,
  allNumbers: AllowedNumber[],
  nowHHMM: string
): string[] {
  const enabled = direction === 'incoming' ? settings.incoming_enabled : settings.outgoing_enabled;
  if (!enabled) {
    return allNumbers.map((n) => n.number);
  }

  const start = direction === 'incoming' ? settings.incoming_start : settings.outgoing_start;
  const end = direction === 'incoming' ? settings.incoming_end : settings.outgoing_end;
  const within = isWithinWindow(nowHHMM, start, end);

  if (within) {
    return allNumbers.map((n) => n.number);
  }
  return allNumbers.filter((n) => n.always_allowed).map((n) => n.number);
}
