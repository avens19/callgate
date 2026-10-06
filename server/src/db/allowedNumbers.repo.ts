import { db } from './connection';

export interface AllowedNumber {
  id: number;
  number: string;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export function listAll(): AllowedNumber[] {
  return db.prepare('SELECT * FROM allowed_numbers ORDER BY label, number').all() as AllowedNumber[];
}

export function listNumbers(): string[] {
  return listAll().map((row) => row.number);
}

export function insert(number: string, label: string | null): AllowedNumber {
  const info = db
    .prepare('INSERT INTO allowed_numbers (number, label) VALUES (?, ?)')
    .run(number, label);
  return db.prepare('SELECT * FROM allowed_numbers WHERE id = ?').get(info.lastInsertRowid) as AllowedNumber;
}

export function update(id: number, number: string, label: string | null): AllowedNumber | undefined {
  db.prepare(
    "UPDATE allowed_numbers SET number = ?, label = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
  ).run(number, label, id);
  return db.prepare('SELECT * FROM allowed_numbers WHERE id = ?').get(id) as AllowedNumber | undefined;
}

export function remove(id: number): void {
  db.prepare('DELETE FROM allowed_numbers WHERE id = ?').run(id);
}
