CREATE TABLE allowed_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  label TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE call_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voipms_cdr_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
  other_number TEXT NOT NULL,
  started_at TEXT NOT NULL,
  duration_seconds INTEGER,
  disposition TEXT,
  was_allowed INTEGER NOT NULL DEFAULT 1,
  raw_json TEXT
);
CREATE INDEX idx_call_log_started_at ON call_log(started_at DESC);

CREATE TABLE sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_applied_numbers_hash TEXT,
  last_sync_status TEXT NOT NULL DEFAULT 'idle',
  last_sync_error TEXT,
  last_sync_at TEXT,
  last_cdr_poll_at TEXT,
  provisioning_version INTEGER NOT NULL DEFAULT 0
);
INSERT INTO sync_state (id, last_sync_status, provisioning_version) VALUES (1, 'idle', 0);
