import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDialPlan, EMERGENCY_NUMBER } from './dialPlan';

test('911 is always present, even with an empty list', () => {
  const plan = buildDialPlan([]);
  assert.match(plan, new RegExp(EMERGENCY_NUMBER));
});

test('911 is always present alongside real numbers', () => {
  const plan = buildDialPlan(['5551234567']);
  assert.equal(plan, '{5551234567 | 911}');
});

test('numbers are normalized to digits only', () => {
  const plan = buildDialPlan(['(555) 123-4567']);
  assert.equal(plan, '{5551234567 | 911}');
});

test('duplicate numbers (including an explicit 911 entry) are not repeated', () => {
  const plan = buildDialPlan(['5551234567', '5551234567', '911']);
  assert.equal(plan, '{5551234567 | 911}');
});
