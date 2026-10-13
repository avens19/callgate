import test from 'node:test';
import assert from 'node:assert/strict';
import { isWithinWindow, isValidHHMM } from './clock';

test('simple same-day window', () => {
  assert.equal(isWithinWindow('10:00', '07:00', '20:00'), true);
  assert.equal(isWithinWindow('06:59', '07:00', '20:00'), false);
  assert.equal(isWithinWindow('20:00', '07:00', '20:00'), false); // end exclusive
});

test('window crossing midnight', () => {
  assert.equal(isWithinWindow('23:00', '20:00', '07:00'), true);
  assert.equal(isWithinWindow('03:00', '20:00', '07:00'), true);
  assert.equal(isWithinWindow('12:00', '20:00', '07:00'), false);
});

test('equal start and end means no restriction (always within)', () => {
  assert.equal(isWithinWindow('03:00', '07:00', '07:00'), true);
});

test('HH:MM validation', () => {
  assert.equal(isValidHHMM('07:00'), true);
  assert.equal(isValidHHMM('23:59'), true);
  assert.equal(isValidHHMM('24:00'), false);
  assert.equal(isValidHHMM('7:00'), false);
  assert.equal(isValidHHMM('07:60'), false);
  assert.equal(isValidHHMM('not-a-time'), false);
});
