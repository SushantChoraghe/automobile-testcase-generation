# AutoCase Forge

Privacy-first automobile manual test-case generation with Local Mistral and optional cloud LLM providers.

AutoCase Forge converts User Stories, Acceptance Criteria, and ordinary requirement sentences into strict, traceable manual test cases. Local Mistral runs through Ollama on the user's computer, so automobile requirements do not need to leave the machine.

## Highlights

- Local Mistral generation through Ollama
- No API key required for local generation
- Optional OpenAI, Anthropic, and Google Gemini providers
- Strict automobile-domain prompt controls
- Detailed multi-step test cases
- Acceptance Criterion isolation
- Externally observable Expected Result enforcement
- Truncated-response detection
- Device-local repeat-result caching
- Low-memory and Balanced performance profiles
- No runtime package dependencies

## Privacy model

Local Mistral is the recommended provider.

In Local Mistral mode:

- Requests are sent only to Ollama at `http://127.0.0.1:11434`.
- No LLM API key is required.
- Requirements and generated test cases are not sent to a cloud LLM provider.
- Request bodies are not logged or persisted by the application.
- The local model endpoint is fixed in server code and cannot be replaced from the browser.
- Optional repeat-result caching remains in the user's browser and can be cleared from the interface.

Cloud providers are optional. When selected, the provider key is used only for the active request and is not stored, cached, returned, logged, or written to a file.

> A public deployment operator controls the server through which cloud-provider keys pass. For the strongest privacy boundary, run AutoCase Forge and Ollama locally on a reviewed computer.

## Requirements

- Windows, macOS, or Linux
- Node.js 20 or newer
- Ollama and the `mistral` model for private local generation
- Approximately 8 GB RAM for the Low-memory profile
- At least 16 GB RAM for the Balanced profile

## Windows quick start

### 1. Install Ollama

Download and install Ollama from [ollama.com/download](https://ollama.com/download).

Close Command Prompt or PowerShell after installation, open a new terminal, and verify:

```bat
ollama --version
```

### 2. Download Mistral

```bat
ollama pull mistral
```

Test the model:

```bat
ollama run mistral
```

Enter `/bye` to exit. Ollama normally runs its local service in the Windows background, so `ollama serve` may not be necessary.

### 3. Download AutoCase Forge

```bat
git clone https://github.com/SushantChoraghe/automobile-testcase-generation.git
cd automobile-testcase-generation
```

### 4. Start the application

```bat
npm start
```

Open [http://localhost:3000](http://localhost:3000).

No `npm install` is required because the application uses only Node.js built-ins.

## Using the generator

1. Select **Local Mistral (private)**.
2. Keep the model name as `mistral`.
3. Select a performance profile.
4. Enter a User Story, Acceptance Criteria, or ordinary automobile requirements.
5. Select **Generate test cases**.
6. Copy the completed output.

The API-key field is disabled in Local Mistral mode. It becomes available only when a cloud provider is selected.

## Performance profiles

| Profile | Context | Maximum output | Recommended system |
| --- | ---: | ---: | --- |
| Low memory | 4,096 tokens | 2,048 tokens | 8 GB RAM |
| Balanced | 8,192 tokens | 2,048 tokens | At least 16 GB RAM |

Local generation has a 10-minute timeout. Ollama keeps the model loaded for 10 minutes after a request, making subsequent requests faster.

The first request is normally slower because the model must load into memory. Check processor allocation during generation:

```bat
ollama ps
```

- `100% GPU` means full GPU allocation.
- `100% CPU` means CPU-only inference and slower generation.
- A CPU/GPU split means partial GPU offloading.

If Windows memory reaches 100% and disk usage is high, close other applications and use the Low-memory profile.

## Writing effective requirements

Every Acceptance Criterion should independently state:

- Operating conditions
- Trigger or action
- Exact values and units
- Duration or timing window
- Externally observable expected behavior
- Response time when applicable
- Explicit negative or boundary behavior when those tests are required

Recommended structure:

```text
When [explicit operating conditions]
and [explicit trigger]
for [explicit duration or timing window],
the [exact component name]
shall [externally observable behavior]
within [explicit response time].
```

Avoid undefined terms such as “correctly,” “properly,” “normally,” or “quickly.” The generator will not invent their meaning.

### Example

```text
When the vehicle speed is ≥ 50 km/h and the driver's horizontal gaze angle is < -30 degrees or > 30 degrees for a cumulative duration > 3.5 seconds within a 6.0-second sliding window, the Driver Monitoring System (DMS) shall generate a Level 2 visual warning and a Level 2 auditory warning within 1.5 seconds.
```

## Output quality controls

The generator applies these controls before returning output:

- Every generated step must map to explicit requirement text.
- Numbered Acceptance Criteria cannot borrow unstated conditions from one another.
- Definitions may clarify terms but cannot introduce new triggers.
- Every explicit number, unit, comparison, duration, and window must remain covered.
- Negative tests require explicitly defined negative behavior.
- Expected Results must be externally observable.
- Internal-only requirements produce a Review Note rather than an invented test.
- Responses ending inside a summary, step, or Expected Result are rejected as incomplete.
- Prompt-version changes invalidate results cached by an older prompt.

For detailed examples and corrective guidance, read the [Test Case Generation Quality Guide](docs/GENERATION_TROUBLESHOOTING.md).

## Troubleshooting

| Problem | Resolution |
| --- | --- |
| `'ollama' is not recognized` | Install Ollama, close the current terminal, and open a new one |
| Local Mistral is unavailable | Start the Ollama application and run `ollama pull mistral` |
| Generation is slow | Use Low memory, close other applications, and run `ollama ps` |
| Generation times out | Confirm Ollama is running and check CPU/GPU allocation |
| Response is incomplete | Split the Acceptance Criteria or use Balanced on a suitable computer |
| Only one test case is returned | Define additional negative, boundary, reset, or timing behavior |
| A Review Note is returned | Define the ambiguous term or missing externally observable behavior |
| Old output appears again | Select **Clear saved results** in the application |

## Optional cloud providers

The following providers are available:

- OpenAI
- Anthropic
- Google Gemini

Select a provider, enter an exact model ID, and supply the corresponding API key. Provider endpoints are fixed by the server. Arbitrary endpoint URLs are not accepted.

## Configuration

The application accepts these environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | HTTP port; defaults to `3000` |
| `ALLOWED_ORIGIN` | Production | Exact public origin permitted to submit generation requests |

Example:

```bash
ALLOWED_ORIGIN=https://example.com PORT=3000 npm start
```

Node.js does not automatically load `.env` files. Configure environment variables through the operating system, deployment service, or process manager. Use HTTPS for any non-local deployment and configure reverse proxies not to log request bodies or authorization material.

## Security controls

- Restrictive Content Security Policy
- Same-origin request validation
- Fixed provider endpoints
- Request-body size limit
- Model-name validation
- Per-client rate limiting
- Provider request timeouts
- Output-format validation
- Prohibited-field validation
- Incomplete-output rejection
- Secret and environment-file exclusions in `.gitignore`

## Project structure

```text
public/
  app.js                 Browser interaction and device-local caching
  index.html             Application interface
  styles.css             Responsive interface styles
src/
  prompt.js              Automobile test-generation rules
  providers.js           Local and cloud provider adapters
  server.js              HTTP server and security controls
  validation.js          Request and model-output validation
test/
  prompt.test.js         Prompt behavior tests
  validation.test.js     Validation tests
docs/
  GENERATION_TROUBLESHOOTING.md
```

## Development

Start with automatic server restarts:

```bash
npm run dev
```

Run the complete test suite:

```bash
npm test
```

Run syntax checks:

```bash
node --check src/server.js
node --check src/providers.js
node --check src/prompt.js
node --check public/app.js
```

## Contributing

Changes to generation behavior should:

1. Preserve strict traceability to the supplied input.
2. Avoid introducing automobile-domain assumptions.
3. Increment `PROMPT_VERSION` when output behavior changes.
4. Add or update automated tests.
5. Update the quality guide when user-visible behavior changes.

## License

This project is available under the [MIT License](LICENSE).
