import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEffectiveNumbers } from './effectiveNumbers';
import type { AllowedNumber } from '../db/allowedNumbers.repo';
import type { ScheduleSettings } from './schedule.repo';

function number(n: string, alwaysAllowed = false): AllowedNumber {
  return {
    id: 1,
    number: n,
    label: null,
    always_allowed: alwaysAllowed ? 1 : 0,
    created_at: '',
    updated_at: '',
  };
}

function settings(overrides: Partial<ScheduleSettings> = {}): ScheduleSettings {
  return {
    id: 1,
    incoming_enabled: 0,
    incoming_start: '07:00',
    incoming_end: '20:00',
    outgoing_enabled: 0,
    outgoing_start: '07:00',
    outgoing_end: '20:00',
    ...overrides,
  };
}

test('schedule disabled: full list allowed regardless of time', () => {
  const nums = [number('1'), number('2')];
  const result = computeEffectiveNumbers('outgoing', settings({ outgoing_enabled: 0 }), nums, '02:00');
  assert.deepEqual(result.sort(), ['1', '2']);
});

test('schedule enabled, inside window: full list allowed', () => {
  const nums = [number('1'), number('2')];
  const s = settings({ outgoing_enabled: 1, outgoing_start: '07:00', outgoing_end: '20:00' });
  const result = computeEffectiveNumbers('outgoing', s, nums, '12:00');
  assert.deepEqual(result.sort(), ['1', '2']);
});

test('schedule enabled, outside window: only always_allowed numbers remain', () => {
  const nums = [number('1'), number('2', true)];
  const s = settings({ outgoing_enabled: 1, outgoing_start: '07:00', outgoing_end: '20:00' });
  const result = computeEffectiveNumbers('outgoing', s, nums, '23:00');
  assert.deepEqual(result, ['2']);
});

test('incoming and outgoing schedules are independent', () => {
  const nums = [number('1')];
  const s = settings({
    incoming_enabled: 1,
    incoming_start: '07:00',
    incoming_end: '20:00',
    outgoing_enabled: 0,
  });
  const outsideHHMM = '23:00';
  assert.deepEqual(computeEffectiveNumbers('incoming', s, nums, outsideHHMM), []);
  assert.deepEqual(computeEffectiveNumbers('outgoing', s, nums, outsideHHMM), ['1']);
});
