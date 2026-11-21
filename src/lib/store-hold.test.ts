import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_ORDER_PRODUCT_SLUGS,
  areAllItemsOrderable,
  isOrderingAllowed,
} from "./store-hold";

describe("temporary storefront ordering hold", () => {
  it("allows exactly the tent, bundle, swing, and rocking chair", () => {
    assert.deepEqual([...ALLOWED_ORDER_PRODUCT_SLUGS], [
      "teepetent",
      "tent-swing-bundle",
      "theswing",
      "therocker",
    ]);
    for (const slug of ALLOWED_ORDER_PRODUCT_SLUGS) {
      assert.equal(isOrderingAllowed(slug), true);
    }
  });

  it("does not allow the measurement gate to be ordered as a regular product", () => {
    assert.equal(isOrderingAllowed("safetygate"), false);
  });

  it("blocks checkout when any paused product is still in the cart", () => {
    assert.equal(areAllItemsOrderable([{ slug: "teepetent" }, { slug: "crib-classic" }]), false);
    assert.equal(areAllItemsOrderable([{ slug: "teepetent" }, { slug: "therocker" }]), true);
    assert.equal(areAllItemsOrderable([]), false);
  });
});
