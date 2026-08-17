import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInput, validateModelOutput, validateRequest } from "../src/validation.js";

test("normalizes line endings without changing internal wording", () => {
  assert.equal(normalizeInput("  Brake  active  \r\nExpected warning  \r\n"), "Brake  active\nExpected warning");
});

test("accepts a supported request", () => {
  assert.equal(validateRequest({ provider: "openai", apiKey: "12345678", model: "model-1", userInput: "When A, B" }), null);
});

test("accepts Local Mistral without an API key", () => {
  assert.equal(validateRequest({ provider: "local_mistral", apiKey: "", model: "mistral", userInput: "When A, B" }), null);
});

test("rejects unsupported providers", () => {
  assert.match(validateRequest({ provider: "custom", apiKey: "12345678", model: "model", userInput: "A" }), /supported provider/);
});

test("accepts a correctly formatted output", () => {
  const value = "TC-001: Brake\n- **Steps**:\n  1. Brake\n- **Expected Result**: Warning";
  assert.equal(validateModelOutput(value), value);
});

test("rejects prohibited fields", () => {
  assert.throws(() => validateModelOutput("TC-001: Brake\nPriority: High"), /prohibited field/);
});
