import { config } from '../config';
import * as allowedNumbers from '../db/allowedNumbers.repo';
import * as schedule from './schedule.repo';
import { computeEffectiveNumbers } from './effectiveNumbers';
import { currentTimeInZone } from './clock';
import { hashNumbers } from '../lib/hashNumbers';
import { requestSync } from '../sync/orchestrator';

const TICK_INTERVAL_MS = 60_000;

let lastIncomingHash: string | null = null;
let lastOutgoingHash: string | null = null;

function tick(): void {
  const settings = schedule.get();
  if (!settings.incoming_enabled && !settings.outgoing_enabled) return;

  const nowHHMM = currentTimeInZone(config.displayTimezone);
  const allNumbers = allowedNumbers.listAll();
  const incomingHash = hashNumbers(computeEffectiveNumbers('incoming', settings, allNumbers, nowHHMM));
  const outgoingHash = hashNumbers(computeEffectiveNumbers('outgoing', settings, allNumbers, nowHHMM));

  const changed = incomingHash !== lastIncomingHash || outgoingHash !== lastOutgoingHash;
  lastIncomingHash = incomingHash;
  lastOutgoingHash = outgoingHash;

  if (changed) {
    requestSync();
  }
}

/** Call once at startup, and again whenever schedule settings are saved. */
export function startScheduleWatcher(): void {
  tick();
  setInterval(tick, TICK_INTERVAL_MS);
}

/** Forces a re-check on the next call, used right after settings change. */
export function resetWatcherState(): void {
  lastIncomingHash = null;
  lastOutgoingHash = null;
}
