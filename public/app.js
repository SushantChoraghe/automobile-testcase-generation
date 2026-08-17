const form = document.querySelector('#generator-form');
const provider = document.querySelector('#provider');
const model = document.querySelector('#model');
const apiKey = document.querySelector('#api-key');
const performanceProfile = document.querySelector('#performance-profile');
const requirements = document.querySelector('#requirements');
const remember = document.querySelector('#remember');
const generate = document.querySelector('#generate');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
const copy = document.querySelector('#copy');
const count = document.querySelector('#character-count');
const cachePrefix = 'autocase-forge:';
let promptVersion = '1.0.0';
const providerDefaults = {
  local_mistral: { model: 'mistral', placeholder: 'Not needed for Local Mistral' },
  openai: { model: '', placeholder: 'Used for this request only' },
  anthropic: { model: '', placeholder: 'Used for this request only' },
  gemini: { model: '', placeholder: 'Used for this request only' }
};

async function initialize() {
  try {
    const response = await fetch('/api/providers');
    const data = await response.json();
    promptVersion = data.promptVersion;
    for (const item of data.providers) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      provider.append(option);
    }
    configureProvider();
  } catch {
    setStatus('Unable to load provider configuration.', true);
  }
}

function configureProvider() {
  const local = provider.value === 'local_mistral';
  apiKey.required = !local;
  apiKey.disabled = local;
  apiKey.value = '';
  apiKey.placeholder = providerDefaults[provider.value]?.placeholder || 'Used for this request only';
  document.querySelector('#toggle-key').hidden = local;
  document.querySelector('#performance-profile-label').hidden = !local;
  document.querySelector('#privacy-message').textContent = local
    ? 'Local Mistral keeps requirements and generated test cases on this machine. No API key or cloud connection is used.'
    : 'Your key is sent through this server to the selected provider and is discarded after the request. For maximum trust, use Local Mistral.';
  model.value = providerDefaults[provider.value]?.model || '';
}

provider.addEventListener('change', configureProvider);

function normalize(value) {
  return value.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim();
}

async function fingerprint(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

function render(value, message) {
  output.textContent = value;
  copy.disabled = !value;
  setStatus(message);
}

requirements.addEventListener('input', () => {
  count.textContent = `${requirements.value.length.toLocaleString()} / 30,000`;
});

document.querySelector('#toggle-key').addEventListener('click', event => {
  const reveal = apiKey.type === 'password';
  apiKey.type = reveal ? 'text' : 'password';
  event.currentTarget.textContent = reveal ? 'Hide' : 'Show';
  event.currentTarget.setAttribute('aria-label', `${reveal ? 'Hide' : 'Show'} API key`);
});

copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.textContent);
  setStatus('Copied to clipboard.');
});

document.querySelector('#clear-cache').addEventListener('click', () => {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(cachePrefix)) localStorage.removeItem(key);
  }
  setStatus('Saved results cleared from this device.');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const userInput = normalize(requirements.value);
  const cacheKey = cachePrefix + await fingerprint(`${promptVersion}\n${provider.value}\n${model.value.trim()}\n${performanceProfile.value}\n${userInput}`);
  if (remember.checked) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return render(cached, 'Reused the identical result saved on this device.');
  }

  generate.disabled = true;
  generate.textContent = 'Generating…';
  output.textContent = '';
  copy.disabled = true;
  setStatus('Generating test cases…');
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.value,
        model: model.value.trim(),
        apiKey: provider.value === 'local_mistral' ? '' : apiKey.value,
        performanceProfile: performanceProfile.value,
        userInput
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Generation failed.');
    if (remember.checked) localStorage.setItem(cacheKey, data.output);
    render(data.output, 'Generation complete.');
    apiKey.value = '';
  } catch (error) {
    setStatus(error.message || 'Generation failed.', true);
  } finally {
    generate.disabled = false;
    generate.textContent = 'Generate test cases';
  }
});

initialize();
