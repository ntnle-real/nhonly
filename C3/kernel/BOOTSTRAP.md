# Bootstrap

How to load the kernel and write contracts.

This file gives a developer one lawful load sequence from kernel theory to executable code without borrowed context.

## CHAPTER: THE LOAD

Three-step sequence to understand and use the kernel:

**Step 1: Read THEORY.md (5 minutes)**

Understand the five forces (MARK, Purpose, Success, Failure, Conduct) and the spatial proof shape. Takes ~5 minutes. You now understand the conceptual model.

When you finish THEORY.md, you know:
- Why MARK (chapters) matters
- What Purpose (one sentence) declares
- How Success (observable conditions) defines winning
- How Failure (observable conditions) defines losing
- Why Conduct (obs calls) creates auditable code
- How the spatial arrangement (MARK < Purpose < Success < Failure < contract < conduct < binding) is itself the proof

**Step 2: Read this file (BOOTSTRAP.md) (10 minutes)**

Learn the contract shapes for your language and how to wire them with obs calls. Takes ~10 minutes. You now know the pattern.

When you finish BOOTSTRAP.md, you know:
- How contracts are declared in your language (Python, JavaScript, SQL, Svelte)
- What the obs API methods do (obs.read, obs.step, obs.observe, obs.return_)
- How to bind contracts to code so both are always checked
- How the temporal gradient (obs calls) proves execution matched the contract

**Step 3: Study EXAMPLES/{your_language}/ (15 minutes)**

Read 2-3 working implementations in your programming language. Observe how MARK, Purpose, Success, Failure are laid out before the contract and conduct. Takes ~15 minutes. You can now write contracts.

When you finish EXAMPLES, you can:
- Write MARK headers that name your regions
- Write Purpose sentences that declare intent
- Write Success and Failure conditions
- Write contracts in your language
- Write conduct with obs calls
- Wire them with bindings

**Then: Write all code using CONTRACTS.md shapes and obs.step/observe/return_ calls.**

(See § THE PATTERN below for the shapes.)

## CHAPTER: THE ANCHORS

The kernel files that ground understanding. You do not need files outside the kernel. Everything is here.

- **theory** — kernel/THEORY.md — Forces and proof shape
- **templates** — kernel/CONTRACTS.md — Contract templates for your language
- **reference** — kernel/obs_api.md — Observation API documentation
- **examples** — kernel/EXAMPLES/{language}/ — Working implementations
- **guides** — kernel/BOOTSTRAP.md — This file (you are here)

When you need to understand something:
1. Start with this file (BOOTSTRAP.md)
2. Reference THEORY.md for force definitions
3. Check CONTRACTS.md for your language template
4. Study EXAMPLES for real code
5. Use obs_api.md if you need method signatures

## CHAPTER: THE PATTERN

The contract shape for EACH language. Copy these patterns into your code and customize.

### For Python

```python
# MARK: FORCE(Actor) -> REGION NAME
# Purpose: One sentence — what this region does.
# Success: Observable conditions that define winning.
# Failure: Observable conditions that define losing.

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

def function_name(input, *, obs) -> ReturnType:
    obs.read("INPUT_NOUN", input)
    obs.step("step_1")
    # ... implementation ...
    obs.observe("observation_1")
    obs.step("step_2")
    # ... more implementation ...
    return obs.return_("OUTPUT_NOUN", result)

function_name = observed_by(function_name_contract)(function_name)
```

The contract declares intent. The function executes with obs calls. The binding wires them. The reader verifies the proof by reading top-down.

### For JavaScript/TypeScript

```javascript
// MARK: FORCE(Actor) -> REGION NAME
// Purpose: One sentence.
// Success: Observable conditions.
// Failure: Observable conditions.

const functionNameContract = {
  serves: "what this function serves",
  declares: { input: "INPUT_NOUN", output: "OUTPUT_NOUN" },
  succeeds_if: {
    reads: ["INPUT_NOUN"],
    steps: ["step_1", "step_2"],
    observes: ["observation_1"],
    returns: ["OUTPUT_NOUN"],
  },
  fails_if: {
    observes: ["failure_observation"],
  },
};

function functionName(input, obs) {
  obs.read("INPUT_NOUN", input);
  obs.step("step_1");
  // ... implementation ...
  obs.observe("observation_1");
  obs.step("step_2");
  // ... more implementation ...
  return obs.return_("OUTPUT_NOUN", result);
}

// Bind the contract to the function
functionName = bindContract(functionNameContract)(functionName);
```

In TypeScript, add types:

```typescript
interface InputType { /* ... */ }
interface OutputType { /* ... */ }

function functionName(input: InputType, obs: ObserverAPI): OutputType {
  obs.read("INPUT_NOUN", input);
  // ... rest same as JavaScript ...
}
```

### For SQL

```sql
-- MARK: FORCE(Actor) -> REGION NAME
-- Purpose: One sentence.
-- Success: Observable conditions (CHECK constraints).
-- Failure: Observable conditions (violated constraints).

CREATE TABLE example (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    CHECK (length(name) > 0)  -- Enforces a success condition
);

-- @serves "description"
-- @declares "INPUT_NOUN", "OUTPUT_NOUN"
-- @succeeds_if "reads INPUT_NOUN" "returns OUTPUT_NOUN"

INSERT INTO example (id, name) VALUES (?, ?)
  -- Conduct: Execute with validation
  -- The INSERT will fail if CHECK constraints are violated
  -- This proves the contract (success/failure conditions) was enforced
;
```

The contract is the schema and CHECK constraints. The conduct is the INSERT/UPDATE/DELETE logic. The binding is the enforcement by the database.

### For Svelte

```svelte
<!-- MARK: FORCE(Actor) -> REGION NAME -->
<!-- Purpose: One sentence. -->
<!-- Success: Observable conditions (assertions). -->
<!-- Failure: Observable conditions (assertion failures). -->

<script>
  export let inputData; // INPUT_NOUN

  // Contract as JSDoc
  /**
   * @serves "what this component serves"
   * @declares "INPUT_NOUN" "OUTPUT_NOUN"
   * @succeeds_if "reads INPUT_NOUN" "returns OUTPUT_NOUN"
   */

  function processData(obs) {
    obs?.read("INPUT_NOUN", inputData);
    obs?.step("step_1");
    // ... implementation ...
    const result = /* compute result */;
    obs?.observe("observation_1");
    return obs?.return_("OUTPUT_NOUN", result) ?? result;
  }

  // Runtime assertion (failure condition)
  $: {
    console.assert(inputData !== null, "INPUT_NOUN must be provided");
  }

  const output = processData(obs);
</script>

<!-- Conduct: Render based on output -->
{#if output}
  <div>{output}</div>
{:else}
  <div>No output (failure condition)</div>
{/if}
```

The contract is the JSDoc and assertion guards. The conduct is the component logic. The binding is the spatial arrangement of assertions before render.

## CHAPTER: THE API

The observation API methods. Use these inline in your code.

**obs.read(var_name, value)**
Record an input variable. The contract's `reads` clause must name this variable.
Example: `obs.read("user_id", userId)`
Proves: "This variable was read at this boundary."

**obs.step(step_name)**
Mark an execution boundary. The contract's `steps` clause must name this step.
Example: `obs.step("validation")`
Proves: "Code reached this step."

**obs.observe(obs_type, detail)**
Record an observation. The contract's `observes` clause must name this observation type.
Example: `obs.observe("validation_passed")`
Proves: "This condition was observed at this boundary."

**obs.return_(var_name, value)**
Return a value and close the gradient. The contract's `returns` clause must name this variable.
Example: `return obs.return_("output", result")` — returns result unchanged.
Proves: "This value was returned, matching the contract."

**State: Use these inline.** obs.return_() is pass-through; it returns the value as-is.

**State: The contract's succeeds_if clauses (reads, steps, observes, returns) must match your obs calls.**

## CHAPTER: THE GOAL

State the purpose of the bootstrap:

- After reading THEORY and this file, you understand the model.
- After studying EXAMPLES, you can write contracts in your language.
- All code you write must follow the spatial proof shape and use obs calls.
- This ensures your code stays readable, verifiable, and auditable.
- The kernel teaches the discipline. Your code executes it.

When you complete this bootstrap:

1. You know the five forces (MARK, Purpose, Success, Failure, Conduct).
2. You know the spatial proof shape (MARK < Purpose < Success < Failure < contract < conduct < binding).
3. You know the temporal gradient (obs.read, obs.step, obs.observe, obs.return_).
4. You can write contracts in Python, JavaScript, SQL, or Svelte.
5. You can bind those contracts to code.
6. You can read other contract-driven code and verify the proof without executing it.

This discipline keeps code legible as you grow. When requirements change, the marked boundaries and contracts stay clear. When bugs appear, the gradient trace shows exactly where execution deviated.

The kernel is the liturgy. Your code is the practice. Together, they keep the story readable.
