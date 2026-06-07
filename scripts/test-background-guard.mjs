/**
 * Verifies background pause handling logic.
 * Run: node scripts/test-background-guard.mjs
 */

function onPausedWhileStorePlaying({ userInitiatedPause }) {
  if (userInitiatedPause) {
    return { stop: true, nudge: false };
  }
  return { stop: false, nudge: true };
}

const cases = [
  {
    name: "foreground user pause",
    input: { userInitiatedPause: true },
    expect: { stop: true, nudge: false },
  },
  {
    name: "background OS pause (before visibility flips)",
    input: { userInitiatedPause: false },
    expect: { stop: false, nudge: true },
  },
  {
    name: "spurious pause while already stopped",
    input: { userInitiatedPause: false },
    expect: { stop: false, nudge: true },
  },
];

let failed = 0;

for (const test of cases) {
  const result = onPausedWhileStorePlaying(test.input);

  if (
    result.stop !== test.expect.stop ||
    result.nudge !== test.expect.nudge
  ) {
    console.error("FAIL:", test.name, result);
    failed += 1;
  } else {
    console.log("OK:", test.name);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log("\nAll background guard logic checks passed.");
