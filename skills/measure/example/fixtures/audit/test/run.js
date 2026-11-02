'use strict';
const assert = require('assert');
const lim = require('../src/limiter');

lim._reset();
assert.strictEqual(lim.isAllowed('alice', 0), true, 'first attempt allowed');
assert.strictEqual(lim.isAllowed('alice', 1000), true, 'second attempt allowed');
lim.recordSuccess('alice');
assert.strictEqual(lim.isAllowed('alice', 2000), true, 'after success allowed');
console.log('all passing (3 checks)');
