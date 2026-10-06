import test from 'node:test';
import assert from 'node:assert/strict';
import { isIpInCidr } from './cidr';

test('matches an address inside the range', () => {
  assert.equal(isIpInCidr('192.168.219.50', '192.168.219.0/24'), true);
});

test('rejects an address outside the range', () => {
  assert.equal(isIpInCidr('203.0.113.5', '192.168.219.0/24'), false);
});

test('exact /32 match', () => {
  assert.equal(isIpInCidr('10.0.0.1', '10.0.0.1/32'), true);
  assert.equal(isIpInCidr('10.0.0.2', '10.0.0.1/32'), false);
});

test('0.0.0.0/0 matches everything', () => {
  assert.equal(isIpInCidr('1.2.3.4', '0.0.0.0/0'), true);
});
