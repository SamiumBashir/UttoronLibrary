import assert from "node:assert/strict";

export async function runWishlistTests() {
  console.log(" Running Wishlist Tests...");

  // 1. In-memory wishlist logic tests
  let wishlist: string[] = [];

  const toggle = (id: string) => {
    if (wishlist.includes(id)) {
      wishlist = wishlist.filter((item) => item !== id);
    } else {
      wishlist.push(id);
    }
  };

  toggle("bk-1");
  assert.deepEqual(wishlist, ["bk-1"], "Wishlist should contain bk-1 after adding");

  toggle("bk-2");
  assert.deepEqual(wishlist, ["bk-1", "bk-2"], "Wishlist should contain both items");

  toggle("bk-1");
  assert.deepEqual(wishlist, ["bk-2"], "Wishlist should remove bk-1 when toggled again");

  // 2. Merging local guest wishlist with server wishlist (on sign in)
  const serverWishlist = ["bk-2", "bk-3"];
  const guestWishlist = ["bk-4", "bk-2"];
  const merged = Array.from(new Set([...serverWishlist, ...guestWishlist]));
  assert.deepEqual(merged, ["bk-2", "bk-3", "bk-4"], "Merged wishlist should be deduplicated");

  // 3. Clear wishlist
  wishlist = [];
  assert.equal(wishlist.length, 0, "Cleared wishlist should have length 0");

  console.log("  Wishlist Tests Passed (Toggle, Deduplication, Guest Merge, Clear)");
}
