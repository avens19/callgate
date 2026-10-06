import crypto from 'node:crypto';
import { config } from '../config';
import * as allowedNumbers from '../db/allowedNumbers.repo';
import * as syncState from '../db/syncState.repo';
import * as callerIdFiltering from '../voipms/callerIdFiltering';
import { sendResyncNotify } from '../ht801/resync';
import { triggerReboot } from '../ht801/reboot';

function hashNumbers(numbers: string[]): string {
  const sorted = [...numbers].sort();
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}

let debounceTimer: NodeJS.Timeout | null = null;

/** Call after any add/edit/delete of allowed_numbers. */
export function requestSync(): void {
  syncState.setStatus('pending');
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    applyPendingChanges().catch((err) => {
      syncState.setStatus('error', (err as Error).message);
    });
  }, config.sync.applyDebounceMs);
}

/** Bypasses the debounce wait; used by the "Sync now" button and startup recovery. */
export async function syncImmediately(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await applyPendingChanges();
}

async function applyPendingChanges(): Promise<void> {
  syncState.setStatus('applying');

  const numbers = allowedNumbers.listNumbers();

  // voip.ms CallerID Filtering sync is cheap (no device disruption) - do it
  // every pass.
  const result = await callerIdFiltering.syncFilters(numbers);
  if (result.failed.length > 0) {
    throw new Error(
      `voip.ms CallerID Filtering sync had failures: ${result.failed.map((f) => `${f.number}: ${f.error}`).join('; ')}`
    );
  }

  // The HT801 touch reboots the phone line, so only do it if the set of
  // numbers actually changed since the last successful apply.
  const newHash = hashNumbers(numbers);
  const state = syncState.get();
  if (newHash !== state.last_applied_numbers_hash) {
    await sendResyncNotify();
    await triggerReboot();
    syncState.markApplied(newHash);
  }

  syncState.setStatus('idle');
}

/** Called once at startup: resumes a sync that was interrupted by a restart. */
export function recoverPendingSyncOnBoot(): void {
  const state = syncState.get();
  if (state.last_sync_status === 'pending' || state.last_sync_status === 'applying') {
    requestSync();
  }
}
