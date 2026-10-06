import { db } from './connection';

export type Direction = 'inbound' | 'outbound';

export interface CallLogRow {
  id: number;
  voipms_cdr_id: string | null;
  direction: Direction;
  other_number: string;
  started_at: string;
  duration_seconds: number | null;
  disposition: string | null;
  was_allowed: number;
  raw_json: string | null;
}

export interface NewCallLogEntry {
  voipmsCdrId: string;
  direction: Direction;
  otherNumber: string;
  startedAt: string;
  durationSeconds: number | null;
  disposition: string | null;
  wasAllowed: boolean;
  rawJson: string;
}

const upsertStmt = db.prepare(`
  INSERT INTO call_log (voipms_cdr_id, direction, other_number, started_at, duration_seconds, disposition, was_allowed, raw_json)
  VALUES (@voipmsCdrId, @direction, @otherNumber, @startedAt, @durationSeconds, @disposition, @wasAllowed, @rawJson)
  ON CONFLICT(voipms_cdr_id) DO UPDATE SET
    direction = excluded.direction,
    other_number = excluded.other_number,
    started_at = excluded.started_at,
    duration_seconds = excluded.duration_seconds,
    disposition = excluded.disposition,
    was_allowed = excluded.was_allowed,
    raw_json = excluded.raw_json
`);

export function upsertMany(entries: NewCallLogEntry[]): void {
  const run = db.transaction((rows: NewCallLogEntry[]) => {
    for (const row of rows) {
      upsertStmt.run({
        voipmsCdrId: row.voipmsCdrId,
        direction: row.direction,
        otherNumber: row.otherNumber,
        startedAt: row.startedAt,
        durationSeconds: row.durationSeconds,
        disposition: row.disposition,
        wasAllowed: row.wasAllowed ? 1 : 0,
        rawJson: row.rawJson,
      });
    }
  });
  run(entries);
}

export function listRecent(limit: number, beforeId?: number): CallLogRow[] {
  if (beforeId) {
    return db
      .prepare('SELECT * FROM call_log WHERE id < ? ORDER BY started_at DESC LIMIT ?')
      .all(beforeId, limit) as CallLogRow[];
  }
  return db.prepare('SELECT * FROM call_log ORDER BY started_at DESC LIMIT ?').all(limit) as CallLogRow[];
}
