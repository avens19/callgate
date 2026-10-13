const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidHHMM(value: string): boolean {
  return HHMM_RE.test(value);
}

/** Current wall-clock time in the given IANA timezone, as "HH:MM". */
export function currentTimeInZone(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

/**
 * Whether `nowHHMM` falls within [startHHMM, endHHMM). Handles windows that
 * cross midnight (e.g. start "20:00", end "07:00"). If start === end, the
 * window is treated as the full day (no restriction).
 */
export function isWithinWindow(nowHHMM: string, startHHMM: string, endHHMM: string): boolean {
  if (startHHMM === endHHMM) return true;
  if (startHHMM < endHHMM) {
    return nowHHMM >= startHHMM && nowHHMM < endHHMM;
  }
  return nowHHMM >= startHHMM || nowHHMM < endHHMM;
}
