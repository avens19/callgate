function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: Number(optional('PORT', '3000')),
  dataDir: optional('DATA_DIR', '/data'),

  voipms: {
    apiUsername: required('VOIPMS_API_USERNAME'),
    apiPassword: required('VOIPMS_API_PASSWORD'),
    did: required('VOIPMS_DID'),
    subaccount: required('VOIPMS_SUBACCOUNT'),
  },

  ht801: {
    ip: required('HT801_IP'),
    mac: required('HT801_MAC').toLowerCase(),
    adminUser: optional('HT801_ADMIN_USER', 'admin'),
    adminPassword: optional('HT801_ADMIN_PASSWORD', ''),
    dialPlanPValue: required('HT801_DIAL_PLAN_PVALUE'),
    sipPort: Number(optional('HT801_SIP_PORT', '5060')),
    requiresExplicitReboot: optional('HT801_REQUIRES_EXPLICIT_REBOOT', 'false') === 'true',
  },

  sync: {
    applyDebounceMs: Number(optional('APPLY_DEBOUNCE_MS', '30000')),
  },

  cdr: {
    pollIntervalMs: Number(optional('CDR_POLL_INTERVAL_MS', '300000')),
  },

  displayTimezone: optional('DISPLAY_TIMEZONE', 'America/Edmonton'),

  provisioningAllowedCidr: optional('PROVISIONING_ALLOWED_CIDR', '0.0.0.0/0'),
};
