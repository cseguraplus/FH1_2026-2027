import assert from "node:assert/strict";
import { test } from "node:test";
import { commissionAmounts, commissionTotal } from "../lib/commissions.ts";

test("una compra por nivel distribuye 900, 225 y 125 MXN", () => {
  assert.deepEqual(commissionAmounts, [900,225,125]);
  assert.equal(commissionTotal([1,1,1]),1250);
});
test("simula cero compras, tres directos y organizaciones de ejemplo", () => {
  for (const [counts, total] of [[[0,0,0],0],[[3,0,0],2700],[[5,25,125],25750],[[10,100,600],106500],[[10,100,1000],156500],[[100000,100000,100000],125000000]]) {
    assert.equal(commissionTotal(counts), total);
  }
});
