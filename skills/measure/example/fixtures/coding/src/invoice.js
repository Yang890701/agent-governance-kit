'use strict';

// Invoice totals. Money is handled in integer cents throughout.
// items: [{ name, unitCents, qty }]
// opts:  { discountPct?: number (0-100), taxPct?: number (0-100) }

function subtotal(items) {
  return items.reduce((sum, it) => sum + it.unitCents * it.qty, 0);
}

function total(items, opts = {}) {
  const sub = subtotal(items);
  const discount = sub * (opts.discountPct || 0) / 100;
  const taxed = (sub - discount) * (1 + (opts.taxPct || 0)) / 100;
  return taxed;
}

module.exports = { subtotal, total };
