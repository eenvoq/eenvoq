import test from 'node:test';
import assert from 'node:assert/strict';

import { getDemoLoginConfig } from './demoAccounts';

test('returns the Krakki business demo account', () => {
  const account = getDemoLoginConfig('krakki');

  assert.equal(account.profileType, 'business');
  assert.equal(account.name, 'Krakki');
  assert.equal(account.subtype, 'Retail Store');
});

test('throws for unknown demo accounts', () => {
  assert.throws(() => getDemoLoginConfig('unknown'));
});
