<!-- MARK: CONSTRAINT(Input) -> Validate Email Address Form -->
<!-- Purpose: Validate email input in a form component. -->
<!-- Success: Email is validated, form state updates, no errors. -->
<!-- Failure: Email is invalid, error message displayed, form is invalid. -->

<script>
  /**
   * Email Validator Component
   *
   * @component
   * Validates email input and provides feedback.
   *
   * @event {object} validation - Dispatched with { isValid, email, message }
   */

  import { createEventDispatcher } from "svelte";

  export let email = ""; // INPUT_VARIABLE_NAME
  const dispatch = createEventDispatcher();

  let isValid = false; // OUTPUT_VARIABLE_NAME
  let errorMessage = "";

  /**
   * @serves "validate email input"
   * @declares "email" "isValid"
   * @succeeds_if "reads email" "returns isValid"
   */
  function validateEmailInput(obs) {
    obs?.read("email", email);
    obs?.step("check_format");

    // Step 1: Check format
    if (!email || !email.includes("@")) {
      obs?.observe("email_invalid", `missing @ symbol`);
      errorMessage = "Email must contain @ symbol";
      return false;
    }

    obs?.step("check_domain");

    // Step 2: Check domain
    const [local, domain] = email.split("@");
    if (!local || !domain || !domain.includes(".")) {
      obs?.observe("email_invalid", `invalid domain: ${domain}`);
      errorMessage = "Email must have valid domain";
      return false;
    }

    // Record success
    obs?.observe("email_valid", `email=${email}`);
    errorMessage = "";

    return obs?.return_("isValid", true) ?? true;
  }

  // Runtime validation on email change
  $: {
    if (email) {
      try {
        isValid = validateEmailInput(obs);
        dispatch("validation", { isValid, email, message: errorMessage });
      } catch (error) {
        isValid = false;
        errorMessage = error.message || "Validation failed";
        dispatch("validation", { isValid, email, message: errorMessage });
      }
    } else {
      isValid = false;
      errorMessage = "";
      dispatch("validation", { isValid, email, message: errorMessage });
    }

    // Runtime assertion
    console.assert(
      !email || email.includes("@"),
      "email must contain @ or be empty"
    );
  }
</script>

<div class="form-validator">
  <label for="email-input">Email Address</label>
  <input
    id="email-input"
    type="email"
    bind:value={email}
    placeholder="example@domain.com"
    class:invalid={!isValid && email}
  />
  {#if errorMessage}
    <p class="error-message">{errorMessage}</p>
  {:else if isValid}
    <p class="success-message">Email is valid</p>
  {/if}
</div>

<style>
  .form-validator {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: bold;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  input.invalid {
    border-color: #d32f2f;
    background-color: #ffebee;
  }

  .error-message {
    color: #d32f2f;
    font-size: 0.875rem;
  }

  .success-message {
    color: #388e3c;
    font-size: 0.875rem;
  }
</style>
