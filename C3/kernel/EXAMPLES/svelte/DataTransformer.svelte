<!-- MARK: CONDUCT(Processor) -> Transform User Data -->
<!-- Purpose: Transform raw user data into normalized form. -->
<!-- Success: User object is normalized with all required fields. -->
<!-- Failure: Required fields missing or validation fails. -->

<script>
  /**
   * User Data Transformer Component
   *
   * @component
   * Transforms raw user data into normalized form.
   *
   * @param {object} rawData - Raw user data { id, email, name, active }
   * @event {object} transformed - Dispatched with normalized user data
   */

  import { createEventDispatcher } from "svelte";

  export let rawData = { id: "", email: "", name: "", active: true };
  const dispatch = createEventDispatcher();

  let normalizedUser = null; // OUTPUT_VARIABLE_NAME
  let transformError = "";

  /**
   * @serves "transform raw user data into normalized form"
   * @declares "rawData" "normalizedUser"
   * @succeeds_if "reads rawData" "returns normalizedUser"
   */
  function transformUserData(obs) {
    obs?.read("raw_user", rawData);
    obs?.step("extract_fields");

    // Step 1: Extract fields
    let id = rawData?.id;
    let email = rawData?.email;
    let name = rawData?.name;
    let isActive = rawData?.active ?? true;

    if (!id || !email || !name) {
      obs?.observe("missing_required_field", "id, email, or name is missing");
      throw new Error("id, email, and name are required");
    }

    obs?.step("normalize_email");

    // Step 2: Normalize email
    email = email.toLowerCase().trim();
    if (!email.includes("@")) {
      obs?.observe("invalid_email", email);
      throw new Error(`Invalid email: ${email}`);
    }

    obs?.step("validate_user");

    // Step 3: Validate user
    if (typeof isActive !== "boolean") {
      isActive = Boolean(isActive);
    }

    obs?.observe("transformation_complete", `user_id=${id}, email=${email}`);

    // Create normalized user
    const result = { id, email, name, isActive };
    return obs?.return_("normalized_user", result) ?? result;
  }

  // Trigger transformation when raw data changes
  $: {
    try {
      normalizedUser = transformUserData(obs);
      transformError = "";
      dispatch("transformed", normalizedUser);
    } catch (error) {
      normalizedUser = null;
      transformError = error.message || "Transformation failed";
      dispatch("transformed", null);
    }

    // Runtime assertions
    console.assert(
      !rawData.email || rawData.email.includes("@"),
      "email must contain @ symbol"
    );
    console.assert(rawData.id !== undefined, "id must be defined");
  }
</script>

<div class="data-transformer">
  <h3>User Data Transformer</h3>

  {#if transformError}
    <div class="error">
      <p>Error: {transformError}</p>
    </div>
  {:else if normalizedUser}
    <div class="success">
      <p><strong>Transformation Complete</strong></p>
      <dl>
        <dt>ID:</dt>
        <dd>{normalizedUser.id}</dd>
        <dt>Email:</dt>
        <dd>{normalizedUser.email}</dd>
        <dt>Name:</dt>
        <dd>{normalizedUser.name}</dd>
        <dt>Active:</dt>
        <dd>{normalizedUser.isActive ? "Yes" : "No"}</dd>
      </dl>
    </div>
  {:else}
    <p>No data to transform</p>
  {/if}
</div>

<style>
  .data-transformer {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  h3 {
    margin-top: 0;
  }

  .error {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 1rem;
    border-radius: 4px;
  }

  .success {
    background-color: #e8f5e9;
    color: #388e3c;
    padding: 1rem;
    border-radius: 4px;
  }

  dl {
    margin: 0;
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 0.5rem;
  }

  dt {
    font-weight: bold;
  }
</style>
