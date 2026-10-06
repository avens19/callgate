import { config } from '../config';
import { request } from './client';
import type { CdrEntry, VoipMsResponse } from './types';
import type { NewCallLogEntry } from '../db/callLog.repo';

interface CdrResponse extends VoipMsResponse {
  cdr?: CdrEntry[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD, voip.ms date param format
}

/**
 * Field names/timezone are unconfirmed against the live API (spike #3).
 * This maps the best-effort shape into our normalized call_log rows.
 */
export async function fetchCdr(from: Date, to: Date): Promise<NewCallLogEntry[]> {
  const res = await request<CdrResponse>('getCDR', {
    date_from: formatDate(from),
    date_to: formatDate(to),
    timezone: '0', // request UTC if voip.ms honors this; confirm in spike #3
  });

  const rows = res.cdr ?? [];
  return rows.map((row) => toCallLogEntry(row));
}

function toCallLogEntry(row: CdrEntry): NewCallLogEntry {
  const isInbound = row.destination === config.voipms.did || row.account === config.voipms.subaccount;
  const direction: 'inbound' | 'outbound' = isInbound ? 'inbound' : 'outbound';
  const otherNumber = direction === 'inbound' ? String(row.callerid ?? '') : String(row.destination ?? '');
  const cdrId = `${row.date}-${row.callerid}-${row.destination}`;

  return {
    voipmsCdrId: cdrId,
    direction,
    otherNumber,
    startedAt: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
    durationSeconds: row.duration ? Number(row.duration) : null,
    disposition: row.disposition ?? null,
    wasAllowed: true, // actual check against the whitelist happens where this is inserted
    rawJson: JSON.stringify(row),
  };
}
