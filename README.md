# AutoCase Forge

AutoCase Forge is a small, self-hostable web application for generating strict manual test cases from automobile requirements. It accepts a User Story, Acceptance Criteria, ordinary sentences, or a mixture of those formats.

Supported providers:

- OpenAI
- Anthropic
- Google Gemini

Users supply their own provider key and model ID for each request.

## Security model

- API keys are entered into a password field and sent only to this server over the current origin.
- Keys are held only for the provider request. They are not stored, cached, logged, returned, or written to files.
- Provider endpoints are fixed in server code. Users cannot supply arbitrary URLs.
- Request bodies have a size limit, model IDs are constrained, and generation requests are rate-limited by client address.
- Responses include a restrictive Content Security Policy and other browser security headers.
- Optional repeat-result caching uses browser `localStorage`. The cache key excludes the API key, and the saved output never leaves that browser except through an explicit generation request.
- `.env` files, private keys, and common secret-file patterns are excluded from Git.

A public deployment operator controls the server through which keys pass. Users who require the strongest assurance should self-host a reviewed copy. Always use restricted provider keys and configure spend limits where available.

## Requirements

- Node.js 20 or newer

The project uses only Node.js built-ins and has no runtime package dependencies.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

No server-owned LLM key is required. Enter a provider key and model ID in the application.

## Configuration

Copy `.env.example` values into your deployment environment. Node does not automatically load `.env` files.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `3000`. |
| `ALLOWED_ORIGIN` | Production | Exact public origin allowed to submit generation requests. |

Run with environment variables directly:

```bash
ALLOWED_ORIGIN=https://example.com PORT=3000 npm start
```

Use HTTPS in production. Configure your reverse proxy not to log request bodies or authorization material.

## Test

```bash
npm test
```

## Deterministic repeat behavior

When “Reuse identical results on this device” is enabled, the browser hashes the prompt version, provider, model, and normalized requirements. An identical request returns the first saved output without another provider call. The API key is never part of the cache key or cached value.

Changing the prompt version, provider, model, or requirements creates a different cache entry.

## License

MIT
