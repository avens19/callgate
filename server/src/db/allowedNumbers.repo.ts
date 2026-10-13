import { db } from './connection';

export interface AllowedNumber {
  id: number;
  number: string;
  label: string | null;
  always_allowed: number;
  created_at: string;
  updated_at: string;
}

export function listAll(): AllowedNumber[] {
  return db.prepare('SELECT * FROM allowed_numbers ORDER BY label, number').all() as AllowedNumber[];
}

export function listNumbers(): string[] {
  return listAll().map((row) => row.number);
}

export function insert(number: string, label: string | null, alwaysAllowed: boolean): AllowedNumber {
  const info = db
    .prepare('INSERT INTO allowed_numbers (number, label, always_allowed) VALUES (?, ?, ?)')
    .run(number, label, alwaysAllowed ? 1 : 0);
  return db.prepare('SELECT * FROM allowed_numbers WHERE id = ?').get(info.lastInsertRowid) as AllowedNumber;
}

export function update(
  id: number,
  number: string,
  label: string | null,
  alwaysAllowed: boolean
): AllowedNumber | undefined {
  db.prepare(
    "UPDATE allowed_numbers SET number = ?, label = ?, always_allowed = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
  ).run(number, label, alwaysAllowed ? 1 : 0, id);
  return db.prepare('SELECT * FROM allowed_numbers WHERE id = ?').get(id) as AllowedNumber | undefined;
}

export function remove(id: number): void {
  db.prepare('DELETE FROM allowed_numbers WHERE id = ?').run(id);
}
