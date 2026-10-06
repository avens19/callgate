// Hardcoded, never DB-sourced, never user-editable: a kids' phone must
// always be able to dial 911 regardless of what's in the editable list.
export const EMERGENCY_NUMBER = '911';

function normalizeForDialPlan(number: string): string {
  return number.replace(/[^0-9]/g, '');
}

/**
 * Builds the HT801 FXS "Dial Plan" string: an exact-match whitelist of the
 * given numbers plus the emergency number, e.g. "{5551234567 | 911}".
 */
export function buildDialPlan(allowedNumbers: string[]): string {
  const normalized = allowedNumbers.map(normalizeForDialPlan).filter(Boolean);
  const entries = [...new Set([...normalized, EMERGENCY_NUMBER])];
  return `{${entries.join(' | ')}}`;
}
