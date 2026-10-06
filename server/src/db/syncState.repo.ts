import { db } from './connection';

export type SyncStatus = 'idle' | 'pending' | 'applying' | 'error';

export interface SyncState {
  id: 1;
  last_applied_numbers_hash: string | null;
  last_sync_status: SyncStatus;
  last_sync_error: string | null;
  last_sync_at: string | null;
  last_cdr_poll_at: string | null;
  provisioning_version: number;
}

export function get(): SyncState {
  return db.prepare('SELECT * FROM sync_state WHERE id = 1').get() as SyncState;
}

export function setStatus(status: SyncStatus, error: string | null = null): void {
  db.prepare(
    "UPDATE sync_state SET last_sync_status = ?, last_sync_error = ?, last_sync_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = 1"
  ).run(status, error);
}

export function markApplied(numbersHash: string): void {
  db.prepare(
    'UPDATE sync_state SET last_applied_numbers_hash = ?, provisioning_version = provisioning_version + 1 WHERE id = 1'
  ).run(numbersHash);
}

export function setCdrPollTime(iso: string): void {
  db.prepare('UPDATE sync_state SET last_cdr_poll_at = ? WHERE id = 1').run(iso);
}
