import { config } from '../config';
import { request } from './client';
import type { CallerIdFilteringEntry, VoipMsResponse } from './types';

// Routing target syntax is unconfirmed against the live API (spike #1/#2 in
// the project plan). "account:<subaccount>" is the best-effort guess from
// public docs; confirm by round-tripping a test entry before relying on this.
function routingTargetForSubaccount(): string {
  return `account:${config.voipms.subaccount}`;
}

interface ListResponse extends VoipMsResponse {
  callerid_filtering?: CallerIdFilteringEntry[];
}

export async function listFilters(): Promise<CallerIdFilteringEntry[]> {
  const res = await request<ListResponse>('getCallerIDFiltering');
  return res.callerid_filtering ?? [];
}

export interface SyncResult {
  added: string[];
  removed: string[];
  failed: Array<{ number: string; error: string }>;
}

/**
 * Makes the set of CallerID Filtering entries routed to our subaccount match
 * `desiredNumbers` exactly, leaving unrelated entries (if any pre-existed on
 * the account for other reasons) untouched.
 */
export async function syncFilters(desiredNumbers: string[]): Promise<SyncResult> {
  const existing = await listFilters();
  const existingForUs = existing.filter((e) => e.routing === routingTargetForSubaccount());
  const existingNumbers = new Set(existingForUs.map((e) => e.filter).filter(Boolean) as string[]);
  const desired = new Set(desiredNumbers);

  const toAdd = desiredNumbers.filter((n) => !existingNumbers.has(n));
  const toRemove = existingForUs.filter((e) => e.filter && !desired.has(e.filter));

  const result: SyncResult = { added: [], removed: [], failed: [] };

  for (const entry of toRemove) {
    try {
      await request('delCallerIDFiltering', { filtering: String(entry.filtering) });
      result.removed.push(entry.filter!);
    } catch (err) {
      result.failed.push({ number: entry.filter!, error: (err as Error).message });
    }
  }

  for (const number of toAdd) {
    try {
      await request('setCallerIDFiltering', {
        filter: number,
        routing: routingTargetForSubaccount(),
        description: 'callgate whitelist',
      });
      result.added.push(number);
    } catch (err) {
      result.failed.push({ number, error: (err as Error).message });
    }
  }

  return result;
}
