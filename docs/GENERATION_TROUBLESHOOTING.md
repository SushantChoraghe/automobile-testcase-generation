# Test Case Generation Quality Guide

This guide explains how to obtain complete, traceable automobile manual test cases, diagnose weak output, and improve requirements without introducing unstated behavior.

## Contents

1. [Quality principles](#quality-principles)
2. [Quick diagnosis](#quick-diagnosis)
3. [Writing executable requirements](#writing-executable-requirements)
4. [Worked example](#worked-example)
5. [Common generation problems](#common-generation-problems)
6. [Local performance](#local-performance)
7. [Privacy](#privacy)
8. [Contributor checklist](#contributor-checklist)

## Quality principles

The generator follows four non-negotiable principles:

1. **Traceability:** Every step and Expected Result must map to explicit requirement text.
2. **Isolation:** Each numbered Acceptance Criterion supplies its own conditions and behavior.
3. **Observability:** An Expected Result must be visible or measurable from the stated system behavior.
4. **Completeness:** Every explicit value, unit, comparison, duration, and timing window must remain covered.

The generator does not use general automobile knowledge to complete missing requirements. This restriction prevents plausible but unsupported test behavior.

## Quick diagnosis

| Symptom | Likely cause | Corrective action |
| --- | --- | --- |
| Output ends inside a step | Output-token or context limit reached | Shorten the input, split the criteria, or use the Balanced profile |
| Only one test case is generated | Only one action-and-expected-behavior pair is defined | Add explicit negative, boundary, reset, or timing behavior |
| A test contains too few steps | The requirement contains few explicit clauses | Add measurable operating conditions, triggers, durations, and results |
| A condition appears in the wrong test | The criterion depends on unstated context | Make every criterion independently complete |
| The result says “considers” or “calculates” | The requirement describes internal processing only | Add an externally observable outcome |
| A Review Note is returned | A required term or behavior is undefined | Define the exact term, value, or expected behavior |
| Local generation is slow | Model loading, CPU inference, full RAM, or disk paging | Use Low memory, close other applications, and check `ollama ps` |
| The request times out | Local inference exceeded its allowed duration | Confirm Ollama is running and check processor allocation |

## Writing executable requirements

### Recommended structure

Use one independently executable behavior per Acceptance Criterion:

```text
When [explicit operating conditions]
and [explicit trigger]
for [explicit duration or timing window],
the [exact component name]
shall [externally observable behavior]
within [explicit response time].
```

### Include

- Exact component and actor names
- Operating state or speed condition
- Trigger or input
- Exact values and units
- Inclusive or exclusive operators such as `≥`, `<`, `>`, or `≤`
- Duration, cumulative behavior, and window behavior
- Externally observable Expected Result
- Response time when timing matters
- Explicit behavior for every desired negative or boundary case

### Avoid

- Undefined words such as “correctly,” “properly,” or “quickly”
- References such as “same as above”
- Internal-only statements without observable results
- Missing units
- Unspecified boundary behavior
- Requests for “all variations” without expected behavior for those variations
- Incomplete formatting fragments copied into the input

### Independent Acceptance Criteria

Avoid:

```text
When the vehicle speed is < 50 km/h, the DMS shall not generate a warning.
```

This does not state whether the driver's gaze condition applies.

Prefer:

```text
When the vehicle speed is < 50 km/h and the driver's eyes are directed outside the forward road viewing zone for a cumulative duration > 3.5 seconds within a 6.0-second sliding window, the Driver Monitoring System (DMS) shall not generate a Level 2 visual warning or a Level 2 auditory warning.
```

### Observable Expected Results

Avoid:

```text
The DMS shall consider multiple periods in the cumulative duration calculation.
```

“Consider” and “calculation” describe internal behavior without an observable result.

Prefer:

```text
When the vehicle speed is ≥ 50 km/h and the driver's eyes are directed outside the forward road viewing zone for 2.0 seconds, return to the forward road viewing zone for 1.0 second, and are directed outside the forward road viewing zone again for 2.0 seconds within the same 6.0-second sliding window, the Driver Monitoring System (DMS) shall generate a Level 2 visual warning and a Level 2 auditory warning within 1.5 seconds after the cumulative duration exceeds 3.5 seconds.
```

## Worked example

### Requirement

```text
When the vehicle speed is ≥ 50 km/h and the driver's horizontal gaze angle is < -30 degrees or > 30 degrees for a cumulative duration > 3.5 seconds within a 6.0-second sliding window, the Driver Monitoring System (DMS) shall generate a Level 2 visual warning and a Level 2 auditory warning within 1.5 seconds.
```

### Expected test structure

```text
TC-001: When the vehicle speed is ≥ 50 km/h and the driver's horizontal gaze angle is < -30 degrees or > 30 degrees for a cumulative duration > 3.5 seconds within a 6.0-second sliding window
- **Steps**:
  1. Set the vehicle speed to ≥ 50 km/h.
  2. Set the driver's horizontal gaze angle to < -30 degrees or > 30 degrees.
  3. Maintain a cumulative duration > 3.5 seconds within a 6.0-second sliding window.
  4. Observe the Driver Monitoring System (DMS) for 1.5 seconds.
- **Expected Result**: The Driver Monitoring System (DMS) generates a Level 2 visual warning and a Level 2 auditory warning within 1.5 seconds.
```

The example contains separate steps because the requirement explicitly provides an operating condition, trigger, duration, timing window, and observable result.

## Common generation problems

### Truncated responses

#### Why they occur

The system prompt, user input, and generated output share a finite context budget. Long requirements and detailed suites can exhaust that budget. A smaller local profile reduces memory use but leaves less room for large suites.

#### Application protection

- Low memory permits up to 2,048 generated tokens.
- The last non-empty output line must be a complete Expected Result, permitted negative-test statement, Review Note, or insufficient-information statement.
- Incomplete responses are rejected instead of displayed as complete.
- Prompt-version changes invalidate results saved by an earlier prompt.

#### Prevention

- Submit smaller groups of Acceptance Criteria.
- Remove duplicated wording.
- Use Balanced on a computer with at least 16 GB RAM.
- Never accept a response that ends inside a summary, step, or Expected Result.

### Only one test case

#### Why it occurs

The generator creates one Positive Test Case for each explicit action-and-expected-behavior pair. A Negative Test Case requires explicitly stated negative behavior. The generator does not reverse a positive requirement or invent boundary behavior.

#### Prevention

Define the expected behavior separately for positive conditions, exact boundaries, values below or above boundaries, timing expiry, reset behavior, and invalid or unavailable states.

### Too few steps

The generator can decompose only clauses present in the requirement. It cannot invent setup, navigation, equipment, inputs, or measurements. The prompt requires a separate step for each explicit operating condition, trigger, duration, window, and final observation.

### Conditions copied between criteria

A model may use nearby context to make an incomplete criterion appear executable. Numbered Acceptance Criteria are therefore isolated. A labeled Definition can clarify an exact term but cannot add a trigger or operating condition.

### Invented internal observations

An internal rule may lack a visible or measurable result. Internal-only criteria produce a Review Note. The generator cannot invent observations using terms such as “considers,” “calculates,” “processes,” “tracks,” “stores,” “evaluates,” or “handles.”

## Local performance

### Profiles

| Profile | Context | Maximum output | Recommended system |
| --- | ---: | ---: | --- |
| Low memory | 4,096 tokens | 2,048 tokens | 8 GB RAM |
| Balanced | 8,192 tokens | 2,048 tokens | At least 16 GB RAM |

Run this command while generation is active:

```bat
ollama ps
```

Interpret `100% GPU` as full GPU allocation, `100% CPU` as CPU-only inference, and a CPU/GPU split as partial GPU offloading.

To improve performance:

1. Use Low memory on an 8 GB computer.
2. Close memory-heavy applications and browser tabs.
3. Keep free space available on the Windows system drive.
4. Connect a laptop to power and use an appropriate performance mode.
5. Expect the first request to be slower while the model loads.
6. Keep requirements concise and split large suites.

## Privacy

In Local Mistral mode:

- The application connects to Ollama only at `127.0.0.1:11434`.
- No LLM API key is required.
- Requirements are not sent to a cloud LLM provider.
- The server does not log or persist request bodies.
- Optional repeat-result caching is stored in the user's browser and can be cleared from the interface.

The operator of a computer still controls its operating system, browser storage, backups, monitoring tools, and local access. Protect the machine according to the sensitivity of the requirements.

## Contributor checklist

Before merging a generation change, confirm:

- [ ] Each generated step maps to explicit requirement text.
- [ ] Acceptance Criteria cannot borrow unstated conditions from one another.
- [ ] Definitions clarify terms without adding triggers.
- [ ] Expected Results are externally observable.
- [ ] Numeric values, units, operators, durations, and windows are preserved.
- [ ] Negative cases require explicit negative behavior.
- [ ] Truncated responses are rejected.
- [ ] Performance-profile changes remain within the intended memory budget.
- [ ] `PROMPT_VERSION` is incremented when generation behavior changes.
- [ ] Automated tests cover the new behavior.
- [ ] Documentation explains user-visible changes.

Run validation before submitting changes:

```bash
npm test
node --check src/server.js
node --check src/providers.js
node --check src/prompt.js
node --check public/app.js
```
