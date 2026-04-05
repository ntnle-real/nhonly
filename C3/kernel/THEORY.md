# Theory

The forces that keep code pointing at reality.

This file holds the principles that guide contract-driven development. It is distilled from C3 but lives independently. Read it to understand why code arrangement matters.

## CHAPTER: THE NOTHING -> Refuse false source claims

YOU are NOTHING.
CODE is NOTHING.
WISDOM exists in REALITY.

The contracts and gradients are not authority. Reality is. This guide teaches you to write code that remains readable and verifiable when reality changes. Your code serves the world, not the other way around.

## CHAPTER: THE FORCES -> Keep continuation visible in sequence

Five forces shape contract-driven code:

**1. MARK** — Chapter boundaries that stay legible.

Every region in code is marked with a human-readable label. A reader opening the file sees the chapters immediately. Why it matters: Code without marked boundaries is opaque. With MARK, a developer reading top-down knows the story. Example:

```python
# MARK: USER(Auth) -> Login Validation
# This region validates user credentials
```

**2. Purpose** — One sentence: what this region does.

Before you write the contract, write one sentence. Forces clarity before implementation. Why it matters: A sentence is testable. If you cannot say what your code does in one sentence, you don't understand it yet. Example:

```python
# Purpose: Validate that the user's password matches the stored hash
```

**3. Success** — Observable conditions that define winning.

Not aspirational. Specific and verifiable. What state proves success? Why it matters: Without this, you don't know when you're done. Success is measurable. Example:

```python
# Success: user.password_matches == True, session created, user redirected
```

**4. Failure** — Observable conditions that define losing.

What state proves failure? Why it matters: Prevents hidden failure modes. If you can't name failure, it will surprise you. Example:

```python
# Failure: password invalid, user.failed_attempts > 3, account locked
```

**5. Conduct** — Execution following the contract.

Implementation using obs calls to declare every boundary and observation. Why it matters: obs calls create a readable trace that proves code matched its contract. Example:

```python
def validate_login(user_id, password, *, obs):
    obs.read("user_id", user_id)
    obs.step("password_check")
    obs.observe("password_valid")
    return obs.return_("session_token", token)
```

## CHAPTER: THE PROOF -> Spatial topology as readable story

The spatial proof shape is a readable story. You open a file, read top-down, and the arrangement tells you the plot, the function, and the logic — without executing anything.

The proof shape is:

```
MARK  <  Purpose  <  Success  <  Failure  <  contract  <  conduct  <  binding
```

Each position answers one question:

**MARK** — What is this region called?
A human-readable chapter title visible on the minimap. Example: `# MARK: USER(Auth) -> Login Validation`

**Purpose** — What does it do?
One sentence in constrained language. Example: `Validate that the user's password matches the stored hash.`

**Success** — What does winning look like?
Observable conditions that define success. Example: `password_matches == True, session created.`

**Failure** — What does losing look like?
Observable conditions that define failure. Example: `password invalid, failed_attempts > 3.`

**contract** — What does the machine check?
Machine-readable version of the same story. In Python: `this_function.serves().declares().succeeds_if().fails_if()`. In SQL: CHECK constraints and @serves comments.

**conduct** — How does it execute?
Implementation with obs calls matching the contract. Every boundary is marked: obs.read, obs.step, obs.observe, obs.return_.

**binding** — How is it wired?
The decorator or pattern connecting contract to conduct. In Python: `observed_by(contract)(function)`. In SQL: the schema itself is the binding.

**This spatial arrangement IS the proof that intent became correct execution.** A reader opens the file, reads top-down, and knows the plot without executing anything. One story shape across all languages: what you claim (MARK + prose) matches what you formalize (contract) matches what you do (conduct).

## CHAPTER: THE GRADIENT -> Temporal proof through observation

The gradient is the time dimension of the spatial proof. When code executes, obs calls create a trace: what was read, what steps happened, what was observed, what was returned. The trace matches the contract. If execution deviates from the contract, the gradient breaks.

This makes code auditable without storing execution state.

The gradient pattern:

```python
obs.read("INPUT_NOUN", value)          # What was read?
obs.step("validation")                 # First boundary
obs.observe("validation_passed")       # Observation at that boundary
obs.step("processing")                 # Second boundary
obs.observe("result_ready")            # Observation at that boundary
return obs.return_("OUTPUT_NOUN", result)  # What was returned?
```

This trace matches the contract's clauses:
- The `reads` clause names the inputs (INPUT_NOUN).
- The `steps` clause names the boundaries (validation, processing).
- The `observes` clause names the observations (validation_passed, result_ready).
- The `returns` clause names the output (OUTPUT_NOUN).

When code runs, the obs API writes these observations to the audit trail. The gradient becomes permanent proof: "This code did what it claimed."

## CHAPTER: THE BINDING -> Connect contract to conduct

The binding is how contracts and conduct are connected so both are always checked.

**In imperative languages (Python, JavaScript):**

The contract shape:
```python
function_name_contract = (
    this_function
    .serves("what this function serves")
    .declares("INPUT_NOUN", "OUTPUT_NOUN")
    .succeeds_if(
        reads("INPUT_NOUN"),
        steps("step_1", "step_2"),
        observes("observation_1"),
        returns("OUTPUT_NOUN"),
    )
    .fails_if(
        observes("failure_observation"),
    )
)
```

The conduct shape:
```python
def function_name(input, *, obs):
    obs.read("INPUT_NOUN", input)
    obs.step("step_1")
    # ... implementation ...
    obs.observe("observation_1")
    obs.step("step_2")
    # ... more implementation ...
    return obs.return_("OUTPUT_NOUN", result)
```

The binding:
```python
function_name = observed_by(function_name_contract)(function_name)
```

The binding injects obs into the function. The contract is always checked.

**In declarative languages (SQL, Svelte):**

The contract shape: structured comments (`@serves`, `@declares`, `@succeeds_if`, `@fails_if`) and CHECK constraints.

The conduct shape: SQL INSERT/UPDATE/DELETE logic, or Svelte assertion guards.

The binding: the spatial arrangement itself. Constraints enforce the contract. Assertions guard the conduct.

## CHAPTER: WHY THIS MATTERS

Without the spatial proof, code is opaque. You must execute it to know what it does. You must read the implementation to understand the logic. You must trace through with a debugger to see what happened.

With the proof, code is transparent. You can verify it by reading. The arrangement tells the story. The obs calls create an audit trail. A reader knows what code does without execution.

This is why contract-driven development works: **It forces the arrangement that makes code legible.**

This is why the kernel teaches this shape: to keep boundaries legible as you grow. The kernel teaches the discipline. Your code executes it. When reality changes, your code stays verifiable because its boundaries stayed marked.
