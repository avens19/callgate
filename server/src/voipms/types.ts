// Shapes below are best-effort from public docs/wiki summaries, NOT confirmed
// against the live API (voip.ms's docs site blocks automated fetches). They
// are deliberately permissive (optional/unknown fields) and must be checked
// against a real `getCallerIDFiltering` / `getCDR` response before this
// module is trusted — see spike steps 1-3 in the project plan.

export interface VoipMsResponse {
  status: string; // "success" on success, an error code string otherwise
  [key: string]: unknown;
}

export interface CallerIdFilteringEntry {
  filtering?: string; // the filtering id/code, present when editing an existing entry
  filter?: string; // the CallerID number / pattern being matched
  routing?: string; // e.g. "account:<subaccount>" or "sys:hangup" - UNCONFIRMED syntax
  description?: string;
  [key: string]: unknown;
}

export interface CdrEntry {
  date?: string;
  callerid?: string;
  destination?: string;
  description?: string;
  account?: string;
  disposition?: string;
  duration?: string;
  calltype?: string; // "accountcode"? "international"/"local"? unconfirmed
  [key: string]: unknown;
}
