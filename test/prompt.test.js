import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "../src/prompt.js";

test("prompt version invalidates earlier browser cache entries", () => {
  assert.equal(PROMPT_VERSION, "1.2.0");
});

test("prompt isolates acceptance criteria and requires observable results", () => {
  assert.match(SYSTEM_PROMPT, /each numbered Acceptance Criterion as an independent source/);
  assert.match(SYSTEM_PROMPT, /Do not copy a condition, value, state, or trigger/);
  assert.match(SYSTEM_PROMPT, /Expected Results must be externally observable behaviors/);
});

test("prompt requires deterministic multi-step decomposition", () => {
  assert.match(SYSTEM_PROMPT, /one numbered step for each explicit operating condition/);
  assert.match(SYSTEM_PROMPT, /one final numbered step to observe/);
  assert.match(SYSTEM_PROMPT, /must contain at least two steps/);
  assert.match(SYSTEM_PROMPT, /Do not omit any explicit condition/);
});
