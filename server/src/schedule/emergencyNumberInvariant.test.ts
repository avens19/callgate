import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEffectiveNumbers } from './effectiveNumbers';
import { buildDialPlan, EMERGENCY_NUMBER } from '../ht801/dialPlan';
import type { AllowedNumber } from '../db/allowedNumbers.repo';
import type { ScheduleSettings } from './schedule.repo';

// This is the one invariant that must never break: no matter what the
// schedule or whitelist say, the HT801 dial plan always includes 911. These
// tests exercise the real chain (schedule -> effective numbers -> dial
// plan) rather than each piece in isolation, since that's the path an app
// bug could actually slip through.

function number(n: string, alwaysAllowed = false): AllowedNumber {
  return { id: 1, number: n, label: null, always_allowed: alwaysAllowed ? 1 : 0, created_at: '', updated_at: '' };
}

test('outgoing schedule active, outside window, no always-allowed numbers: dial plan is still {911}', () => {
  const settings: ScheduleSettings = {
    id: 1,
    incoming_enabled: 0,
    incoming_start: '07:00',
    incoming_end: '20:00',
    outgoing_enabled: 1,
    outgoing_start: '07:00',
    outgoing_end: '20:00',
  };
  const numbers = [number('5551234567'), number('5559876543')];

  const effective = computeEffectiveNumbers('outgoing', settings, numbers, '23:00');
  assert.deepEqual(effective, []); // confirms the schedule really did lock everyone out

  const plan = buildDialPlan(effective);
  assert.equal(plan, `{${EMERGENCY_NUMBER}}`);
});

test('outgoing schedule active, inside window: dial plan has the whitelist plus 911', () => {
  const settings: ScheduleSettings = {
    id: 1,
    incoming_enabled: 0,
    incoming_start: '07:00',
    incoming_end: '20:00',
    outgoing_enabled: 1,
    outgoing_start: '07:00',
    outgoing_end: '20:00',
  };
  const numbers = [number('5551234567')];

  const effective = computeEffectiveNumbers('outgoing', settings, numbers, '12:00');
  const plan = buildDialPlan(effective);
  assert.match(plan, new RegExp(EMERGENCY_NUMBER));
  assert.match(plan, /5551234567/);
});
