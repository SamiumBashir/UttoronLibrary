import { runAuthTests } from "./auth.test";
import { runCalculationTests } from "./calculations.test";
import { runSecurityTests } from "./security.test";
import { runEmailTests } from "./email.test";

async function main() {
  console.log("==================================================");
  console.log("  UTTORON PROKASONI - FULL VERIFICATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  try {
    await runAuthTests();
    passed++;
  } catch (err) {
    console.error(" FAIL: Auth test suite failed", err);
    failed++;
  }

  try {
    await runCalculationTests();
    passed++;
  } catch (err) {
    console.error(" FAIL: Calculation test suite failed", err);
    failed++;
  }

  try {
    await runSecurityTests();
    passed++;
  } catch (err) {
    console.error(" FAIL: Security test suite failed", err);
    failed++;
  }

  try {
    await runEmailTests();
    passed++;
  } catch (err) {
    console.error(" FAIL: Email test suite failed", err);
    failed++;
  }

  console.log("==================================================");
  console.log(`Summary: ${passed} suite(s) passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
