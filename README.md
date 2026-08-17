# AutoCase Forge

AutoCase Forge is a small, self-hostable web application for generating strict manual test cases from automobile requirements. It accepts a User Story, Acceptance Criteria, ordinary sentences, or a mixture of those formats.

The recommended mode runs Mistral locally through Ollama. Requirements and generated results remain on the same machine, and no LLM API key is needed.

Supported providers:

- Local Mistral through Ollama (recommended)
- OpenAI
- Anthropic
- Google Gemini

Cloud providers remain optional. Users supply their own provider key and model ID when selecting one.

## Security model

- Local Mistral connects only to Ollama at `http://127.0.0.1:11434/api/generate`.
- Local Mistral sends no requirements, results, or credentials to a cloud LLM provider.
- The local endpoint is fixed and cannot be changed through the browser.
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
- Ollama and the local `mistral` model for private local generation

The project uses only Node.js built-ins and has no runtime package dependencies.

## Run locally

Install Ollama from its official distribution, then download the Mistral model once:

```bash
ollama pull mistral
```

Ollama normally starts its local service during installation. If it is not running, start it:

```bash
ollama serve
```

In a separate terminal, start AutoCase Forge:

```bash
npm start
```

Open `http://localhost:3000`.

Select **Local Mistral (private)** and use the `mistral` model. No API key is required.

The default **Low memory** profile uses a 4,096-token context and a 2,048-token output limit for computers with 8 GB RAM. The optional **Balanced** profile uses an 8,192-token context and a 2,048-token output limit for computers with at least 16 GB RAM. Local Mistral has up to 10 minutes to finish, and Ollama keeps the model loaded for 10 minutes so subsequent requests start faster.

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

The generator decomposes every explicitly stated operating condition, trigger, duration, window, and observation into separate numbered steps. It does not create additional steps from unstated information.

See [Generation troubleshooting](docs/GENERATION_TROUBLESHOOTING.md) for root causes, corrective actions, and requirement-writing guidance.

## License

MIT
