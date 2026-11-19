import assert from "node:assert/strict";
import { POST, GET } from "../src/app/api/orders/route";
import { readStore } from "../src/lib/db";

export async function runOrdersTests() {
  console.log(" Running Orders API Tests...");

  // 1. Missing body or invalid JSON test
  const emptyReq = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const emptyRes = await POST(emptyReq);
  assert.equal(emptyRes.status, 400, "Empty payload must return HTTP 400");
  const emptyJson = await emptyRes.json();
  assert.ok(emptyJson.error, "Empty payload must return an error message");

  // 2. Missing customer fields test
  const missingCustReq = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: { fullName: "Test User" }, // missing phone, address, etc.
      items: [{ bookId: "bk-1", quantity: 1 }],
    }),
  });
  const missingCustRes = await POST(missingCustReq);
  assert.equal(missingCustRes.status, 400, "Incomplete customer details must return HTTP 400");

  // 3. Unconfigured gateway must return HTTP 400 (NEVER 502 Bad Gateway)
  const gatewayReq = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        fullName: "সাদমান ইসলাম",
        phone: "01712345678",
        email: "sadman@example.com",
        address: "রোড ২, ধানমন্ডি",
        city: "ঢাকা",
        postalCode: "1205",
      },
      items: [{ bookId: "bk-1", quantity: 1 }],
      paymentMethod: "NAGAD",
    }),
  });
  const gatewayRes = await POST(gatewayReq);
  assert.notEqual(
    gatewayRes.status,
    502,
    "Unconfigured or unavailable gateway must NEVER return HTTP 502"
  );
  assert.equal(
    gatewayRes.status,
    400,
    "Unconfigured or unavailable gateway must return HTTP 400"
  );

  // 4. Valid Cash on Delivery (COD) order placement
  const storeBefore = readStore();
  const testBook = storeBefore.books[0];
  const initialStock = testBook.stock;

  const validReq = new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        fullName: "মাহমুদুর রহমান",
        phone: "01811223344",
        email: "mahmud.rahman@example.com",
        address: "বাড়ি ১৫, রোড ৪, উত্তরা",
        city: "ঢাকা",
        postalCode: "1230",
        instructions: "সাবধানে ডেলিভারি দিন",
      },
      items: [{ bookId: testBook.id, quantity: 1 }],
      paymentMethod: "COD",
    }),
  });

  const validRes = await POST(validReq);
  assert.equal(validRes.status, 201, "Valid COD order must return HTTP 201");
  const validJson = await validRes.json();
  assert.ok(validJson.order, "Response must contain order object");
  assert.ok(
    validJson.order.orderNumber.startsWith("UP-"),
    "Order number must start with UP- prefix"
  );
  assert.equal(
    validJson.order.paymentStatus,
    "PENDING_COD",
    "COD order must have PENDING_COD status"
  );
  assert.equal(
    validJson.order.orderStatus,
    "CONFIRMED",
    "COD order must be immediately CONFIRMED"
  );

  // 5. Verify stock deduction
  const storeAfter = readStore();
  const updatedBook = storeAfter.books.find((b) => b.id === testBook.id);
  assert.equal(
    updatedBook?.stock,
    initialStock - 1,
    "Stock must be atomically decremented by ordered quantity"
  );

  console.log("  Orders API Tests Passed (400 on bad input, 400 on unconfigured gateway, 201 on valid COD, atomic stock decrement)");
}
