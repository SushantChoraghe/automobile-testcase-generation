# Generation troubleshooting

This guide explains common output problems, why they occur, how the application handles them, and how requirement authors can prevent them.

## A response ends in the middle of a test case

### Why it happens

Local models generate within a context and output-token budget. A long system prompt, a long requirement, and many detailed test cases can exhaust that budget. The earlier Low-memory profile allowed only 1,024 output tokens, which was insufficient for several multi-step cases.

### Application protection

- The Low-memory output allowance is 2,048 tokens.
- The response validator checks the final non-empty line.
- A response that ends inside a summary, step, or Expected Result is rejected instead of being displayed as complete.
- Prompt-version changes prevent earlier cached output from being reused.

### How to avoid it

- Submit a smaller group of Acceptance Criteria at a time.
- Keep requirement wording precise and remove duplicated sentences.
- Use the Balanced profile on a computer with at least 16 GB RAM.
- Do not treat a partial response as a completed test suite.

## A test case copies conditions from another Acceptance Criterion

### Why it happens

A model may try to make a short Acceptance Criterion more executable by importing context from nearby criteria. That creates an unstated condition and violates strict traceability.

### Application protection

- Each numbered Acceptance Criterion is treated as an independent source.
- Conditions, values, states, and triggers cannot be copied between criteria unless an explicit reference exists.
- A separately labeled Definition may clarify an exact term, but it cannot add an operating condition or trigger.

### How to avoid it

Make each Acceptance Criterion independently complete. Include every required operating condition, trigger, and externally observable expected behavior in that criterion.

Avoid:

```text
When the vehicle speed is < 50 km/h, the DMS shall not generate a warning.
```

Use explicit conditions when they matter:

```text
When the vehicle speed is < 50 km/h and the driver's eyes are directed outside the forward road viewing zone for a cumulative duration > 3.5 seconds within a 6.0-second sliding window, the DMS shall not generate a Level 2 visual warning or a Level 2 auditory warning.
```

## A test case invents an internal observation

### Why it happens

Requirements such as “include both periods in the cumulative duration” describe internal processing but do not provide an externally observable result. A model may invent wording such as “observe the system considering both periods” or “verify the calculation.” Those statements are not executable unless an observable interface or result is specified.

### Application protection

- Expected Results must be externally observable and explicitly stated in the same Acceptance Criterion.
- Invented internal behaviors such as considers, calculates, processes, tracks, stores, evaluates, and handles are prohibited.
- An internal-only criterion produces a Review Note instead of an invented test case.

### How to avoid it

Connect the internal rule to an observable result and provide exact values.

Avoid:

```text
The cumulative duration shall include multiple periods.
```

Prefer:

```text
When the vehicle speed is ≥ 50 km/h and the driver's eyes are directed outside the forward road viewing zone for 2.0 seconds, return to the forward road viewing zone for 1.0 second, and are directed outside the forward road viewing zone again for 2.0 seconds within the same 6.0-second sliding window, the DMS shall generate a Level 2 visual warning and a Level 2 auditory warning within 1.5 seconds after the cumulative duration exceeds 3.5 seconds.
```

## Only one test case is generated

### Why it happens

The strict generator creates one Positive Test Case for each independently stated action-and-expected-behavior pair. It creates a Negative Test Case only when negative behavior is explicitly defined. It does not reverse a positive rule or invent boundary behavior.

### How to avoid it

Explicitly define the expected behavior for:

- the positive condition;
- the exact boundary;
- below or above the boundary;
- timing expiry;
- reset behavior;
- invalid or unavailable conditions.

Do not request “more variations” without supplying the expected behavior for each variation.

## A test case contains too few steps

### Why it happens

Earlier prompt versions asked for the minimum number of steps. This encouraged the model to combine multiple clauses.

### Application protection

The current prompt requires separate steps for every explicit operating condition, trigger, duration, window, and final observation. Every explicit number, unit, comparison, and timing clause must remain covered.

### How to avoid it

Write requirements with distinct conditions and measurable results. The generator can decompose only information that exists in the requirement; it will not invent navigation, equipment, setup, or test data.

## Local generation is slow

### Why it happens

Local inference performance depends on available RAM, GPU memory, model size, and context length. When RAM is full, Windows uses the disk as virtual memory, which can make generation substantially slower.

### How to improve it

- Use the Low-memory profile on an 8 GB computer.
- Close memory-heavy applications before generation.
- Keep sufficient free space on the system drive.
- Check model allocation during generation with `ollama ps`.
- Prefer GPU allocation when supported by the installed hardware and drivers.
- Expect the first request to be slower while the model loads.

## Review checklist for contributors

Before changing generation behavior, verify that:

1. No condition is imported from another Acceptance Criterion.
2. Every generated step maps to explicit requirement text.
3. Every Expected Result is externally observable.
4. Numeric values, units, operators, durations, and windows are preserved.
5. A negative case is generated only from explicit negative behavior.
6. Truncated output is rejected.
7. A prompt change increments `PROMPT_VERSION`.
8. Tests cover the new rule.
