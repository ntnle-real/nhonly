# Contract Templates

Copy-paste starting points for each language

This file provides templates for contract-driven code in Python, JavaScript, TypeScript, Svelte, and SQL. Copy these templates and customize for your needs. Each template shows the complete contract shape: Purpose, Success, Failure, contract declaration, implementation with obs calls, and binding.

**Related reading:** See **kernel/THEORY.md** to understand the spatial proof shape and why this arrangement matters. See **kernel/BOOTSTRAP.md** for guidance on loading the kernel. See **kernel/obs_api.md** for detailed API reference for obs.read, obs.step, obs.observe, and obs.return_.

## How to Use These Templates

1. **Find the section for your language** (Python, JavaScript, TypeScript, Svelte, or SQL)
2. **Copy the entire template** into a new file in your project
3. **Replace REGION_NAME** with your region's name (e.g., "Load User Record", "Validate Email", "Archive Recording")
4. **Replace function_name** and variable names with your actual function and variables
5. **Replace the implementation placeholder** with your actual code
6. **Ensure your obs.step() and obs.observe() calls match** the contract's declared steps and observations
7. **See kernel/obs_api.md** for detailed API reference for each obs method
8. **Study kernel/EXAMPLES/** for real contract implementations in your language

---

## Python Template

Copy this template for Python functions:

```python
# MARK: FORCE(Actor) -> REGION_NAME
# Purpose: One sentence — what this region does.
# Success: Observable conditions that define success (specific and verifiable).
# Failure: Observable conditions that define failure (specific and verifiable).

function_name_contract = (
    this_function
    .serves("One sentence describing what this function serves.")
    .declares("INPUT_VARIABLE_NAME", "OUTPUT_VARIABLE_NAME")
    .succeeds_if(
        reads("INPUT_VARIABLE_NAME"),
        steps("step_1_name", "step_2_name"),
        observes("success_observation_name"),
        returns("OUTPUT_VARIABLE_NAME"),
    )
    .fails_if(
        observes("failure_observation_name"),
    )
)

def function_name(input_variable_name, *, obs):
    """Describe what this function does.

    Args:
        input_variable_name: Description of input
        obs: Observation session (injected by @observed_by decorator)

    Returns:
        output_variable_name: Description of output

    Raises:
        ExceptionType: Description of when this exception is raised
    """
    # Record input variable
    obs.read("INPUT_VARIABLE_NAME", input_variable_name)

    # Step 1: Describe what happens here
    obs.step("step_1_name")
    # ... implementation for step 1 ...
    # Example: fetch data, validate inputs, prepare resources

    # Check for success/failure conditions
    if not condition_for_success:
        obs.observe("failure_observation_name", "detail message")
        raise ValueError("Error message")

    obs.observe("intermediate_observation", "detail")

    # Step 2: Describe what happens here
    obs.step("step_2_name")
    # ... implementation for step 2 ...
    # Example: process, transform, store results

    result = compute_result()

    obs.observe("success_observation_name", "detail message")

    # Return with observation marker
    return obs.return_("OUTPUT_VARIABLE_NAME", result)

# Bind the contract to the function (required in Python)
function_name = observed_by(function_name_contract)(function_name)
```

**Customization instructions:**
- Replace `FORCE` with the actor (USER, SYSTEM, DATABASE, etc.)
- Replace `REGION_NAME` with what this function does
- Replace `function_name` with your actual function name
- Replace `INPUT_VARIABLE_NAME` and `OUTPUT_VARIABLE_NAME` with your actual variable names
- Replace step names to match your function's logic
- Add implementation code between step markers
- Ensure obs.observe() calls match the contract's observes() clause

---

## JavaScript Template

Copy this template for JavaScript functions:

```javascript
// MARK: FORCE(Actor) -> REGION_NAME
// Purpose: One sentence — what this region does.
// Success: Observable conditions that define success.
// Failure: Observable conditions that define failure.

const functionNameContract = {
  serves: "One sentence describing what this function serves.",
  declares: {
    input: "INPUT_VARIABLE_NAME",
    output: "OUTPUT_VARIABLE_NAME",
  },
  succeeds_if: {
    reads: ["INPUT_VARIABLE_NAME"],
    steps: ["step_1_name", "step_2_name"],
    observes: ["success_observation_name"],
    returns: ["OUTPUT_VARIABLE_NAME"],
  },
  fails_if: {
    observes: ["failure_observation_name"],
  },
};

function functionName(inputVariableName, obs) {
  /**
   * Describe what this function does.
   *
   * @param {*} inputVariableName - Description of input
   * @param {*} obs - Observation session (injected by binding)
   * @returns {*} OUTPUT_VARIABLE_NAME - Description of output
   * @throws {Error} When failure condition occurs
   */

  // Record input variable
  obs.read("INPUT_VARIABLE_NAME", inputVariableName);

  // Step 1: Describe what happens here
  obs.step("step_1_name");
  // ... implementation for step 1 ...
  // Example: fetch data, validate inputs, prepare resources

  // Check for success/failure conditions
  if (!conditionForSuccess) {
    obs.observe("failure_observation_name", "detail message");
    throw new Error("Error message");
  }

  obs.observe("intermediate_observation", "detail");

  // Step 2: Describe what happens here
  obs.step("step_2_name");
  // ... implementation for step 2 ...
  // Example: process, transform, store results

  const result = computeResult();

  obs.observe("success_observation_name", "detail message");

  // Return with observation marker
  return obs.return_("OUTPUT_VARIABLE_NAME", result);
}

// Bind the contract to the function (required in JavaScript)
functionName = bindContract(functionNameContract)(functionName);
```

**Customization instructions:**
- Replace the contract object properties with your actual declarations
- Replace `functionName` with your actual function name
- Replace variable names in the contract's `declares` object
- Use camelCase for JavaScript variable names
- Ensure step names and observation names match the contract
- Add implementation code between step markers

---

## TypeScript Template

Copy this template for TypeScript functions with type safety:

```typescript
// MARK: FORCE(Actor) -> REGION_NAME
// Purpose: One sentence — what this region does.
// Success: Observable conditions that define success.
// Failure: Observable conditions that define failure.

interface FunctionNameContract {
  serves: string;
  declares: {
    input: "INPUT_VARIABLE_NAME";
    output: "OUTPUT_VARIABLE_NAME";
  };
  succeeds_if: {
    reads: ["INPUT_VARIABLE_NAME"];
    steps: ["step_1_name", "step_2_name"];
    observes: ["success_observation_name"];
    returns: ["OUTPUT_VARIABLE_NAME"];
  };
  fails_if: {
    observes: ["failure_observation_name"];
  };
}

const functionNameContract: FunctionNameContract = {
  serves: "One sentence describing what this function serves.",
  declares: {
    input: "INPUT_VARIABLE_NAME",
    output: "OUTPUT_VARIABLE_NAME",
  },
  succeeds_if: {
    reads: ["INPUT_VARIABLE_NAME"],
    steps: ["step_1_name", "step_2_name"],
    observes: ["success_observation_name"],
    returns: ["OUTPUT_VARIABLE_NAME"],
  },
  fails_if: {
    observes: ["failure_observation_name"],
  },
};

function functionName(
  inputVariableName: InputType,
  obs: ObservationSession
): OutputType {
  /**
   * Describe what this function does.
   *
   * @param inputVariableName - Description of input
   * @param obs - Observation session (injected by binding)
   * @returns OUTPUT_VARIABLE_NAME - Description of output
   * @throws {Error} When failure condition occurs
   */

  obs.read("INPUT_VARIABLE_NAME", inputVariableName);
  obs.step("step_1_name");
  // ... implementation for step 1 ...
  // Example: fetch data, validate inputs, prepare resources

  if (!conditionForSuccess) {
    obs.observe("failure_observation_name", "detail");
    throw new Error("Error");
  }

  obs.step("step_2_name");
  // ... implementation for step 2 ...
  // Example: process, transform, store results

  const result: OutputType = computeResult();
  obs.observe("success_observation_name", "detail");

  return obs.return_<OutputType>("OUTPUT_VARIABLE_NAME", result);
}

functionName = bindContract(functionNameContract)(functionName);
```

**Customization instructions:**
- Define the contract interface with your actual input/output types
- Replace `InputType` and `OutputType` with your actual TypeScript types
- Use the same type in both the interface and the function signature
- Use generic `obs.return_<OutputType>(...)` for type safety
- The contract object must satisfy the FunctionNameContract interface
- All variable names must be strings in the contract, matching actual usage

---

## Svelte Template

Copy this template for Svelte components with reactive logic:

```svelte
<!-- MARK: FORCE(Actor) -> REGION_NAME -->
<!-- Purpose: One sentence — what this component does. -->
<!-- Success: Observable conditions that define success. -->
<!-- Failure: Observable conditions that define failure. -->

<script>
  /**
   * Component Name
   *
   * @component
   * Describe what this component does.
   *
   * @param {*} inputData - Description of input prop
   * @event {*} output - Dispatched with OUTPUT_DATA when successful
   */

  export let inputData; // INPUT_VARIABLE_NAME

  /**
   * @serves "One sentence describing what this component serves."
   * @declares "INPUT_VARIABLE_NAME" "OUTPUT_VARIABLE_NAME"
   * @succeeds_if "reads INPUT_VARIABLE_NAME" "returns OUTPUT_VARIABLE_NAME"
   */

  let outputData; // OUTPUT_VARIABLE_NAME

  function processData(obs) {
    obs?.read("INPUT_VARIABLE_NAME", inputData);
    obs?.step("step_1_name");

    // Step 1: Implementation
    // ... your logic here ...
    // Example: validate, transform, fetch

    if (!conditionForSuccess) {
      obs?.observe("failure_observation_name", "detail");
      throw new Error("Failure condition");
    }

    obs?.step("step_2_name");
    // Step 2: Implementation
    // ... your logic here ...
    // Example: compute result, prepare output

    const result = computeResult();
    obs?.observe("success_observation_name", "detail");

    return obs?.return_("OUTPUT_VARIABLE_NAME", result) ?? result;
  }

  // Runtime assertions (success/failure conditions)
  $: {
    console.assert(inputData !== null, "INPUT_VARIABLE_NAME must be provided");
  }

  // Execute on input change
  $: {
    try {
      outputData = processData(obs);
    } catch (error) {
      console.error("Processing failed:", error);
    }
  }
</script>

<div class="component-region-name">
  {#if outputData}
    <!-- Display success state -->
    <p>Result: {outputData}</p>
  {:else}
    <!-- Display failure or loading state -->
    <p>No output yet</p>
  {/if}
</div>

<style>
  .component-region-name {
    /* Component styles */
  }
</style>
```

**Customization instructions:**
- Replace `region-name` with your component's purpose
- Export the input prop that the component receives
- Implement processData() with your actual logic
- Use reactive statements ($:) to respond to input changes
- Use optional chaining (obs?.method) since obs may not be injected in all contexts
- The contract is documented in JSDoc comments, not as a separate object
- Return the result or a fallback value in reactive statements

---

## SQL Template

Copy this template for SQL schema and queries with contract semantics:

```sql
-- MARK: FORCE(Actor) -> REGION_NAME
-- Purpose: One sentence — what this table/query does.
-- Success: Observable conditions (CHECK constraints, NOT NULL, UNIQUE).
-- Failure: Observable conditions (constraint violations).

-- @serves "One sentence describing what this table serves."
-- @declares "INPUT_NOUN" "OUTPUT_NOUN"
-- @succeeds_if "reads INPUT_NOUN" "returns OUTPUT_NOUN"

CREATE TABLE example_table (
    -- Primary key (success condition: id is always present)
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Input columns
    input_column_name VARCHAR(255) NOT NULL,

    -- Derived/output columns
    output_column_name VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- SUCCESS conditions as CHECK constraints
    -- These constraints define what state proves success
    CHECK (length(input_column_name) > 0),  -- input must not be empty
    CHECK (created_at IS NOT NULL),          -- creation time is always set

    -- Optional: UNIQUE constraint for data integrity
    UNIQUE KEY uk_input_column_name (input_column_name)
);

-- Example query following contract shape
-- @serves "fetch example record"
-- @declares "id" "example_record"
-- Purpose: Retrieve a record by its ID
-- Success: A row is returned with all columns populated
SELECT
    id,
    input_column_name,
    output_column_name,
    created_at
FROM example_table
WHERE id = ?;  -- INPUT: id (passed as parameter)

-- Example INSERT following contract shape
-- @serves "create new example record"
-- @declares "input_column_name" "id"
-- Purpose: Create a new record with the given input
-- Success: The new record's ID is returned
INSERT INTO example_table (input_column_name, output_column_name)
VALUES (?, NULL)  -- INPUT: input_column_name (passed as parameter)
RETURNING id;     -- OUTPUT: id (the new record's primary key)
```

**Customization instructions:**
- Replace `example_table` with your actual table name
- Replace `input_column_name` and `output_column_name` with your actual columns
- Add or modify CHECK constraints to define success conditions
- Queries should have clear @serves and @declares comments
- SELECT queries should have WHERE clauses matching inputs
- INSERT/UPDATE/DELETE should specify what columns are modified
- Use RETURNING (if supported) to expose output values
- Success conditions are implicit in the table schema (NOT NULL, UNIQUE, CHECK)
- Failure conditions are when constraints are violated (attempt to insert invalid data)

---

## Next Steps

1. **Choose your language above** (Python, JavaScript, TypeScript, Svelte, or SQL)
2. **Copy the template for your language**
3. **Paste into a new file in your project**
4. **Fill in the MARK, Purpose, Success, Failure, and implementation**
5. **Ensure obs calls match the contract** (see kernel/obs_api.md for complete API reference)
6. **Study kernel/EXAMPLES/{your_language}/** for real working examples
7. **Write all functions following this shape**

Each template is self-contained and ready to use. Customize the variable names, step names, and observation names to match your domain, but keep the overall structure intact. The spatial arrangement (MARK → Purpose → Success → Failure → contract → conduct → binding) proves that your code follows the contract.

---

## Contract Principles Recap

**MARK:** Chapter boundary — tells the reader what region this is
**Purpose:** One sentence — what this code does
**Success:** Observable winning conditions — how to verify it worked
**Failure:** Observable losing conditions — what breaks it
**Contract:** Formal declaration — what the code promises
**Conduct:** Implementation — the code that keeps the promise
**Binding:** Wiring — how contract and conduct connect

All together, they form a readable, verifiable proof that your code is trustworthy.
