ALTER TABLE allowed_numbers ADD COLUMN always_allowed INTEGER NOT NULL DEFAULT 0;

CREATE TABLE schedule_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  incoming_enabled INTEGER NOT NULL DEFAULT 0,
  incoming_start TEXT NOT NULL DEFAULT '07:00',
  incoming_end TEXT NOT NULL DEFAULT '20:00',
  outgoing_enabled INTEGER NOT NULL DEFAULT 0,
  outgoing_start TEXT NOT NULL DEFAULT '07:00',
  outgoing_end TEXT NOT NULL DEFAULT '20:00'
);
INSERT INTO schedule_settings (id) VALUES (1);
