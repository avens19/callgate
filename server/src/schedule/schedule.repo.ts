import { db } from '../db/connection';

export interface ScheduleSettings {
  id: 1;
  incoming_enabled: number;
  incoming_start: string; // "HH:MM"
  incoming_end: string;
  outgoing_enabled: number;
  outgoing_start: string;
  outgoing_end: string;
}

export function get(): ScheduleSettings {
  return db.prepare('SELECT * FROM schedule_settings WHERE id = 1').get() as ScheduleSettings;
}

export interface ScheduleUpdate {
  incomingEnabled: boolean;
  incomingStart: string;
  incomingEnd: string;
  outgoingEnabled: boolean;
  outgoingStart: string;
  outgoingEnd: string;
}

export function update(settings: ScheduleUpdate): ScheduleSettings {
  db.prepare(
    `UPDATE schedule_settings SET
      incoming_enabled = ?, incoming_start = ?, incoming_end = ?,
      outgoing_enabled = ?, outgoing_start = ?, outgoing_end = ?
    WHERE id = 1`
  ).run(
    settings.incomingEnabled ? 1 : 0,
    settings.incomingStart,
    settings.incomingEnd,
    settings.outgoingEnabled ? 1 : 0,
    settings.outgoingStart,
    settings.outgoingEnd
  );
  return get();
}
