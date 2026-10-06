import { config } from '../config';
import { buildDialPlan } from './dialPlan';

/**
 * Grandstream provisioning XML skeleton. The exact P-value tag for the FXS
 * Dial Plan field is unconfirmed (spike #4 in the project plan: diff two
 * "Download Device XML Configuration" exports from the device's own web UI,
 * before/after manually changing the Dial Plan field once). Everything else
 * in this file is just the envelope Grandstream devices expect.
 */
export function buildProvisioningXml(allowedNumbers: string[]): string {
  const dialPlan = buildDialPlan(allowedNumbers);
  const pValueTag = config.ht801.dialPlanPValue;

  return `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
<config version="1">
<${pValueTag}>${escapeXml(dialPlan)}</${pValueTag}>
</config>
</gs_provision>
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
