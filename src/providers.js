const PROVIDERS = Object.freeze({
  openai: {
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/responses"
  },
  anthropic: {
    label: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  gemini: {
    label: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  }
});

export function supportedProviders() {
  return Object.entries(PROVIDERS).map(([id, value]) => ({ id, label: value.label }));
}

function ensureSuccessful(response, provider, body) {
  if (response.ok) return;
  const message = body?.error?.message || body?.error?.status || `${provider} request failed`;
  const error = new Error(String(message).slice(0, 300));
  error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
  throw error;
}

async function requestOpenAI(apiKey, model, systemPrompt, userInput, signal) {
  const response = await fetch(PROVIDERS.openai.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, instructions: systemPrompt, input: userInput }),
    signal
  });
  const body = await response.json().catch(() => ({}));
  ensureSuccessful(response, "OpenAI", body);
  if (typeof body.output_text === "string") return body.output_text;
  return (body.output || []).flatMap(item => item.content || [])
    .filter(item => item.type === "output_text").map(item => item.text).join("\n");
}

async function requestAnthropic(apiKey, model, systemPrompt, userInput, signal) {
  const response = await fetch(PROVIDERS.anthropic.endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userInput }]
    }),
    signal
  });
  const body = await response.json().catch(() => ({}));
  ensureSuccessful(response, "Anthropic", body);
  return (body.content || []).filter(item => item.type === "text").map(item => item.text).join("\n");
}

async function requestGemini(apiKey, model, systemPrompt, userInput, signal) {
  const safeModel = encodeURIComponent(model);
  const response = await fetch(`${PROVIDERS.gemini.endpoint}/${safeModel}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userInput }] }],
      generationConfig: { temperature: 0 }
    }),
    signal
  });
  const body = await response.json().catch(() => ({}));
  ensureSuccessful(response, "Gemini", body);
  return (body.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("\n");
}

export async function generateWithProvider({ provider, apiKey, model, systemPrompt, userInput, signal }) {
  if (!PROVIDERS[provider]) {
    const error = new Error("Unsupported provider");
    error.status = 400;
    throw error;
  }
  if (provider === "openai") return requestOpenAI(apiKey, model, systemPrompt, userInput, signal);
  if (provider === "anthropic") return requestAnthropic(apiKey, model, systemPrompt, userInput, signal);
  return requestGemini(apiKey, model, systemPrompt, userInput, signal);
}
