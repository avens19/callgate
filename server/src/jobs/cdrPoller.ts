import { config } from '../config';
import { fetchCdr } from '../voipms/cdr';
import * as callLog from '../db/callLog.repo';
import * as syncState from '../db/syncState.repo';
import * as allowedNumbers from '../db/allowedNumbers.repo';
import { EMERGENCY_NUMBER } from '../ht801/dialPlan';

// Overlap window so a record that lands just after a poll isn't missed by
// the next one starting exactly where the last left off.
const OVERLAP_MS = 60 * 60 * 1000;

async function pollOnce(): Promise<void> {
  const state = syncState.get();
  const from = state.last_cdr_poll_at
    ? new Date(new Date(state.last_cdr_poll_at).getTime() - OVERLAP_MS)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = new Date();

  const entries = await fetchCdr(from, to);
  const whitelist = new Set([...allowedNumbers.listNumbers(), EMERGENCY_NUMBER]);

  const withAllowedFlag = entries.map((entry) => ({
    ...entry,
    wasAllowed: whitelist.has(entry.otherNumber),
  }));

  callLog.upsertMany(withAllowedFlag);
  syncState.setCdrPollTime(to.toISOString());
}

export function startCdrPoller(): void {
  pollOnce().catch((err) => console.error('CDR poll failed:', (err as Error).message));
  setInterval(() => {
    pollOnce().catch((err) => console.error('CDR poll failed:', (err as Error).message));
  }, config.cdr.pollIntervalMs);
}
