import { config } from '../config';

/**
 * Stub. Only needs real logic if spike #5 (project plan) shows that a
 * resync NOTIFY does not cause the HT801 to reboot and apply a changed
 * Dial Plan on its own. If so, the plan is to drive the device's own web
 * UI reboot action using HT801_ADMIN_USER/HT801_ADMIN_PASSWORD - the exact
 * request to make needs to be captured from the browser during that spike,
 * since no documented local HTTP API exists for it.
 */
export async function triggerReboot(): Promise<void> {
  if (!config.ht801.requiresExplicitReboot) {
    return;
  }
  throw new Error(
    'HT801_REQUIRES_EXPLICIT_REBOOT is set but no reboot implementation exists yet - ' +
      'capture the web UI reboot request during spike #5 and implement it here.'
  );
}
