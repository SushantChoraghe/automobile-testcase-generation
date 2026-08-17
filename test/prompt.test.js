import test from "node:test";
import assert from "node:assert/strict";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "../src/prompt.js";

test("prompt version invalidates earlier browser cache entries", () => {
  assert.equal(PROMPT_VERSION, "1.1.0");
});

test("prompt requires deterministic multi-step decomposition", () => {
  assert.match(SYSTEM_PROMPT, /one numbered step for each explicit operating condition/);
  assert.match(SYSTEM_PROMPT, /one final numbered step to observe/);
  assert.match(SYSTEM_PROMPT, /must contain at least two steps/);
  assert.match(SYSTEM_PROMPT, /Do not omit any explicit condition/);
});
