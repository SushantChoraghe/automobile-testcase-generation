import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateWithProvider, supportedProviders } from "./providers.js";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt.js";
import { normalizeInput, validateModelOutput, validateRequest } from "./validation.js";

const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";
const PUBLIC_DIR = fileURLToPath(new URL("../public/", import.meta.url));
const BODY_LIMIT = 45_000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const CLOUD_REQUEST_TIMEOUT_MS = 90_000;
const LOCAL_REQUEST_TIMEOUT_MS = 600_000;
const rateBuckets = new Map();

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cache-Control": "no-store"
};

function sendJson(response, status, value) {
  response.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function clientAddress(request) {
  return request.socket.remoteAddress || "unknown";
}

function rateLimited(request) {
  const now = Date.now();
  const key = clientAddress(request);
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw Object.assign(new Error("Request body is too large."), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Invalid JSON."), { status: 400 }); }
}

function validOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (ALLOWED_ORIGIN) return origin === ALLOWED_ORIGIN;
  const host = request.headers.host;
  return origin === `http://${host}` || origin === `https://${host}`;
}

async function handleGenerate(request, response) {
  if (request.headers["content-type"]?.split(";")[0] !== "application/json") return sendJson(response, 415, { error: "Content-Type must be application/json." });
  if (!validOrigin(request)) return sendJson(response, 403, { error: "Origin is not allowed." });
  if (rateLimited(request)) return sendJson(response, 429, { error: "Too many requests. Try again shortly." });

  const body = await readJson(request);
  const validationError = validateRequest(body);
  if (validationError) return sendJson(response, 400, { error: validationError });

  const controller = new AbortController();
  const requestTimeout = body.provider === "local_mistral" ? LOCAL_REQUEST_TIMEOUT_MS : CLOUD_REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), requestTimeout);
  try {
    const output = await generateWithProvider({
      provider: body.provider,
      apiKey: body.apiKey,
      model: body.model.trim(),
      systemPrompt: SYSTEM_PROMPT,
      userInput: normalizeInput(body.userInput),
      performanceProfile: body.performanceProfile || "low_memory",
      signal: controller.signal
    });
    return sendJson(response, 200, { output: validateModelOutput(output), promptVersion: PROMPT_VERSION });
  } finally {
    clearTimeout(timeout);
    body.apiKey = "";
  }
}

async function serveStatic(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!/^[A-Za-z0-9._/-]+$/.test(relativePath) || relativePath.includes("..")) return sendJson(response, 404, { error: "Not found." });
  try {
    const content = await readFile(join(PUBLIC_DIR, relativePath));
    response.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": MIME[extname(relativePath)] || "application/octet-stream" });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Not found." });
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/api/providers") return sendJson(response, 200, { providers: supportedProviders(), promptVersion: PROMPT_VERSION });
    if (request.method === "POST" && request.url === "/api/generate") return await handleGenerate(request, response);
    if (request.method === "GET" || request.method === "HEAD") return await serveStatic(request, response);
    return sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    const status = error.name === "AbortError" ? 504 : (error.status || 500);
    const message = error.name === "AbortError"
      ? "Generation timed out. Confirm Ollama is running and check whether the model is using the GPU."
      : (status === 500 ? "Unable to generate test cases." : error.message);
    sendJson(response, status, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`AutoCase Forge is running on http://localhost:${PORT}`);
});
