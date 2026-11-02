'use strict';
const assert = require('assert');
const { subtotal, total } = require('../src/invoice');

let failed = 0;
function t(name, fn) {
  try { fn(); console.log('ok   ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' :: ' + e.message); }
}

const items = [{ name: 'pen', unitCents: 199, qty: 3 }, { name: 'pad', unitCents: 450, qty: 2 }];

t('subtotal', () => assert.strictEqual(subtotal(items), 1497));
t('total, no opts', () => assert.strictEqual(total(items), 1497));
t('total, 10% discount', () => assert.strictEqual(total(items, { discountPct: 10 }), 1347));
t('total, 5% tax', () => assert.strictEqual(total(items, { taxPct: 5 }), 1572));
t('total, discount then tax', () => assert.strictEqual(total(items, { discountPct: 10, taxPct: 5 }), 1414));
t('total is integer cents', () => assert.ok(Number.isInteger(total(items, { discountPct: 33, taxPct: 7 }))));

if (failed) { console.log(failed + ' failing'); process.exit(1); }
console.log('all passing');
