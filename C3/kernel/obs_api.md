# Observation API Reference

Methods for declaring execution intent and observing outcomes

The observation API provides four core methods that developers use inline to record execution following the spatial proof shape. This is the complete reference.

For conceptual background on the spatial proof shape and the five forces (MARK, Purpose, Success, Failure, Conduct), see **kernel/THEORY.md**. For guidance on how to load the kernel and apply contract patterns, see **kernel/BOOTSTRAP.md**.

## Overview

The obs API has four core methods, used inline during execution:

1. **obs.read(var_name, value)** — Record an input variable
2. **obs.step(step_name)** — Mark an execution boundary
3. **obs.observe(obs_type, detail=None)** — Record an observation about state or outcome
4. **obs.return_(var_name, value)** — Return a value and close the gradient

These methods create a temporal trace proving execution followed the contract.

### Key Principles

**obs.return_() is pass-through:** It returns the value unchanged. It is a boundary marker, not a transformer.

**Optional in declarative languages:** All methods are optional in declarative languages (SQL, Svelte); they are required in imperative languages (Python, JavaScript, TypeScript). In declarative languages, the schema itself (SQL CREATE TABLE) and component logic (Svelte reactive blocks) serve as the proof.

## obs.read(var_name, value)

### Signature

```
obs.read(var_name: str, value: Any) -> None
```

### Purpose

Record that a variable was read as input. Called at the beginning of a function to declare what inputs are being consumed.

### Parameters

- **var_name** (str): Name of the input variable. Should match the declared INPUT_NOUN in the contract's declares() clause.
- **value** (Any): The actual value of the variable being read.

### Returns

`None` (no return value)

### Remarks

If the variable name does not match declared contract inputs, a warning is issued (non-blocking). This allows for gradual migration of code.

### Examples

#### Python Example

```python
def process_user(user_id, *, obs):
    obs.read("user_id", user_id)
    # ... rest of function ...
```

#### JavaScript Example

```javascript
function processUser(userId, obs) {
  obs.read("user_id", userId);
  // ... rest of function ...
}
```

### Usage Rules

- Call **once per input variable** at the start of the function
- Use the **exact variable name** from the contract's `declares()` clause
- Can be called **multiple times** if multiple variables are inputs
- Should come **before any processing logic**

---

## obs.step(step_name)

### Signature

```
obs.step(step_name: str) -> None
```

### Purpose

Mark an execution boundary. Called to separate distinct phases of work within a function.

### Parameters

- **step_name** (str): Name of the step. Should match the declared step names in the contract's `steps()` clause.

### Returns

`None` (no return value)

### Remarks

If step_name does not match declared steps, a warning is issued (non-blocking). Steps are recorded in call order, creating a readable execution timeline.

### Examples

#### Python Example

```python
def process_user(user_id, *, obs):
    obs.read("user_id", user_id)
    obs.step("fetch_user")
    user = fetch_from_database(user_id)

    obs.step("validate_permissions")
    if not has_permission(user):
        raise PermissionError()

    obs.observe("permissions_validated")
    obs.step("process_record")
    result = apply_business_logic(user)
    return obs.return_("processed_user", result)
```

#### JavaScript Example

```javascript
function processUser(userId, obs) {
  obs.read("user_id", userId);
  obs.step("fetch_user");
  const user = fetchFromDatabase(userId);

  obs.step("validate_permissions");
  if (!hasPermission(user)) {
    throw new PermissionError();
  }

  obs.observe("permissions_validated");
  obs.step("process_record");
  const result = applyBusinessLogic(user);
  return obs.return_("processed_user", result);
}
```

### Usage Rules

- Call **before starting** a distinct phase
- Use step names from the **contract's `steps()` clause**
- **Order matters**: steps are recorded in call order
- Can **nest logically** (e.g., "fetch_user", "validate", "process")
- Use **clear, action-oriented names** (fetch_user, validate_permissions, process_record)

---

## obs.observe(obs_type, detail=None)

### Signature

```
obs.observe(obs_type: str, detail: Optional[str] = None) -> None
```

### Purpose

Record an observation about execution state or outcome. Called when a condition is reached or an event occurs during execution.

### Parameters

- **obs_type** (str): Type of observation. Examples: "validation_passed", "error_occurred", "user_found", "retry_limit_exceeded"
- **detail** (str, optional): Additional detail string to provide context. Examples: "user has admin permissions", "timeout after 5 retries", "email already registered"

### Returns

`None` (no return value)

### Remarks

Observations are not failures or exceptions—they are factual statements about state at a point in execution. Multiple observations can occur in one execution path.

### Examples

#### Python Example

```python
def process_user(user_id, *, obs):
    obs.read("user_id", user_id)
    obs.step("fetch_user")
    user = fetch_from_database(user_id)

    if user is None:
        obs.observe("user_not_found", f"user_id={user_id}")
        raise ValueError("User not found")

    obs.observe("user_found", f"name={user.name}")

    obs.step("validate_permissions")
    if not has_permission(user):
        obs.observe("permission_denied", f"user_role={user.role}")
        raise PermissionError()

    obs.observe("permissions_validated", "user has required role")
    # ... continue execution ...
```

#### JavaScript Example

```javascript
function processUser(userId, obs) {
  obs.read("user_id", userId);
  obs.step("fetch_user");
  const user = fetchFromDatabase(userId);

  if (!user) {
    obs.observe("user_not_found", `user_id=${userId}`);
    throw new Error("User not found");
  }

  obs.observe("user_found", `name=${user.name}`);

  obs.step("validate_permissions");
  if (!hasPermission(user)) {
    obs.observe("permission_denied", `user_role=${user.role}`);
    throw new PermissionError();
  }

  obs.observe("permissions_validated", "user has required role");
  // ... continue execution ...
}
```

### Usage Rules

- Call **when a notable condition is reached**
- Use obs_type names from the **contract's `observes()` clause**
- Provide **detail for context** (optional but recommended)
- **Multiple observations** can be recorded in one execution
- Use **past tense** for states (user_found, permission_validated, error_occurred)

---

## obs.return_(var_name, value)

### Signature

```
obs.return_(var_name: str, value: T) -> T
```

### Purpose

Record a return value and close the gradient. Called before returning from a function. Pass-through: returns the value unchanged.

### Parameters

- **var_name** (str): Name of the return variable. Should match the declared output variable in the contract's `declares()` clause.
- **value** (T): The value to return.

### Returns

Returns `value` unchanged. This is a **pass-through function**—the returned value is exactly what you pass in.

### Remarks

Every successful code path should have exactly one obs.return_() call. Failure paths (exceptions, early returns with errors) do not need obs.return_().

### Examples

#### Python Example

```python
def process_user(user_id, *, obs):
    obs.read("user_id", user_id)
    obs.step("fetch_user")
    user = fetch_from_database(user_id)

    obs.step("process_record")
    result = apply_business_logic(user)

    # The function returns result; obs.return_ records the output
    return obs.return_("processed_user", result)
```

#### JavaScript Example

```javascript
function processUser(userId, obs) {
  obs.read("user_id", userId);
  obs.step("fetch_user");
  const user = fetchFromDatabase(userId);

  obs.step("process_record");
  const result = applyBusinessLogic(user);

  // The function returns result; obs.return_ records and closes
  return obs.return_("processed_user", result);
}
```

### Usage Rules

- Call **immediately before the return statement**
- Use the **exact output variable name** from the contract
- It is **pass-through**; the value returned is the one you pass in
- **Every successful code path** should have exactly one obs.return_() call
- **Failure paths** (exceptions, error returns) do NOT need obs.return_()

---

## Complete Example: Full Function with All Four Methods

```python
# MARK: FETCH(Database) -> Load User Record
# Purpose: Fetch a user from the database by ID, validate the record, and return it.
# Success: User record is loaded, validated, and returned to caller.
# Failure: User not found or database error occurs.

load_user_contract = (
    this_function
    .serves("fetch user record from database")
    .declares("user_id", "user")
    .succeeds_if(
        reads("user_id"),
        steps("fetch", "validate"),
        observes("user_found"),
        returns("user"),
    )
    .fails_if(
        observes("user_not_found"),
        observes("database_error"),
    )
)

def load_user(user_id, *, obs):
    """Load a user record from the database.

    Args:
        user_id: The ID of the user to load
        obs: Observation session (injected by @observed_by decorator)

    Returns:
        user: The user record

    Raises:
        ValueError: If user is not found
        DatabaseError: If database query fails
    """
    # Step 1: Read the input
    obs.read("user_id", user_id)
    obs.step("fetch")

    # Try to fetch from database
    try:
        user = database.query("SELECT * FROM users WHERE id = ?", user_id)
    except Exception as e:
        obs.observe("database_error", str(e))
        raise

    # Check if user exists
    if user is None:
        obs.observe("user_not_found")
        raise ValueError(f"User {user_id} not found")

    # Step 2: Validate the record
    obs.step("validate")
    obs.observe("user_found", f"name={user.name}, email={user.email}")

    # Return the validated user
    return obs.return_("user", user)

load_user = observed_by(load_user_contract)(load_user)
```

---

## Contract vs. Execution Mapping

Understanding the relationship between contract declarations and obs calls:

| Contract Clause | obs Call | Example |
|---|---|---|
| `.reads("user_id")` | `obs.read("user_id", user_id)` | Record that user_id was read |
| `.steps("fetch", "validate")` | `obs.step("fetch")` ... `obs.step("validate")` | Mark execution boundaries |
| `.observes("user_found")` | `obs.observe("user_found", ...)` | Record state condition |
| `.returns("user")` | `return obs.return_("user", user)` | Record output and return |

**Reading top-down:** The contract's `reads()`, `steps()`, and `observes()` clauses declare intent. The execution's `obs.read()`, `obs.step()`, and `obs.observe()` calls provide proof that the contract was followed. The `obs.return_()` closes the gradient.

**The proof shape:** Reading the code top-to-bottom, a developer sees:
1. Contract declaration (what this function promises)
2. Implementation with obs calls (proof that the promise was kept)
3. Binding statement (wiring the contract to the function)

This arrangement makes code intent explicit and verifiable.

---

## Reference: When to Use Each Method

**Use obs.read()** when:
- You want to record that a function parameter was received
- You need to document input variable names for tracing
- Early in a function to declare what it's reading

**Use obs.step()** when:
- A distinct phase or sub-task begins
- You want to separate logical sections of code
- You need to understand the execution timeline

**Use obs.observe()** when:
- A notable state is reached (success, error, condition met)
- You want to record conditional paths through the code
- You need debugging information about what happened

**Use obs.return_()** when:
- You're about to return a value from a successful execution
- You want to record the output variable name and value
- You're closing the gradient (only once per success path)

All four together create a readable, auditable proof that your code executes as intended.
