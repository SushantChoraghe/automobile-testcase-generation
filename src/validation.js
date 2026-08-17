const MAX_INPUT_LENGTH = 30000;
const MAX_MODEL_LENGTH = 120;

export function normalizeInput(value) {
  return value.replace(/\r\n/g, "\n").split("\n").map(line => line.trimEnd()).join("\n").trim();
}

export function validateRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Invalid request body.";
  if (!['local_mistral', 'openai', 'anthropic', 'gemini'].includes(body.provider)) return "Select a supported provider.";
  if (body.provider !== "local_mistral" && (typeof body.apiKey !== "string" || body.apiKey.length < 8 || body.apiKey.length > 500)) return "Enter a valid API key.";
  if (typeof body.model !== "string" || !body.model.trim() || body.model.length > MAX_MODEL_LENGTH) return "Enter a valid model name.";
  if (!/^[A-Za-z0-9._:/-]+$/.test(body.model)) return "The model name contains unsupported characters.";
  if (typeof body.userInput !== "string") return "Enter automobile requirements.";
  const normalized = normalizeInput(body.userInput);
  if (!normalized || normalized.length > MAX_INPUT_LENGTH) return `Requirements must contain 1 to ${MAX_INPUT_LENGTH} characters.`;
  return null;
}

export function validateModelOutput(output) {
  if (typeof output !== "string" || !output.trim()) throw new Error("The provider returned an empty response.");
  const cleaned = output.trim();
  const allowedStart = /^(TC-001:|\*Review Note:|NON-COMPLIANT OUTPUT: INSUFFICIENT EXPLICIT INFORMATION\.)/;
  if (!allowedStart.test(cleaned)) throw new Error("The provider response did not match the required test-case format.");
  const prohibited = /^\s*(Priority|Type|Title|Test Case Title|Test ID|ID|Preconditions|Postconditions|Test Data|Actual Result|Status|Requirement ID)\s*:/gim;
  if (prohibited.test(cleaned)) throw new Error("The provider response contained a prohibited field.");
  return cleaned;
}
