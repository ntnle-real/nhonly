// MARK: CONDUCT(Processor) -> Transform User Record
// Purpose: Transform raw user data into a normalized user object.
// Success: User object created with all required fields populated and validated.
// Failure: Required fields missing, type conversion fails, or validation error.

const transformUserContract = {
  serves: "transform raw user data into normalized user object",
  declares: {
    input: "raw_user",
    output: "normalized_user",
  },
  succeeds_if: {
    reads: ["raw_user"],
    steps: ["extract_fields", "normalize_email", "validate_user"],
    observes: ["transformation_complete"],
    returns: ["normalized_user"],
  },
  fails_if: {
    observes: ["missing_required_field", "invalid_email", "validation_error"],
  },
};

class User {
  /**
   * Normalized user object.
   */
  constructor(id, email, name, isActive = true) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.isActive = isActive;
  }
}

function transformUser(rawUser, obs) {
  /**
   * Transform raw user object into normalized User.
   *
   * @param {object} rawUser - Raw user data { id, email, name, active }
   * @param {*} obs - Observation session (injected)
   * @returns {User} normalized_user - Normalized User instance
   * @throws {Error} If required fields are missing or invalid
   */

  // Read input
  obs.read("raw_user", rawUser);

  // Step 1: Extract fields
  obs.step("extract_fields");
  let userId, email, name, isActive;

  try {
    userId = rawUser?.id;
    email = rawUser?.email;
    name = rawUser?.name;
    isActive = rawUser?.active ?? true;
  } catch (error) {
    obs.observe("missing_required_field", error.message);
    throw new Error(`Failed to extract fields: ${error.message}`);
  }

  if (!userId || !email || !name) {
    obs.observe("missing_required_field", "id, email, or name is missing");
    throw new Error("id, email, and name are required");
  }

  // Step 2: Normalize email
  obs.step("normalize_email");
  email = email.toLowerCase().trim();
  if (!email.includes("@")) {
    obs.observe("invalid_email", email);
    throw new Error(`Invalid email: ${email}`);
  }

  // Step 3: Validate user
  obs.step("validate_user");
  if (typeof isActive !== "boolean") {
    isActive = Boolean(isActive);
  }

  obs.observe("transformation_complete", `user_id=${userId}, email=${email}`);

  // Create and return normalized user
  const normalizedUser = new User(userId, email, name, isActive);
  return obs.return_("normalized_user", normalizedUser);
}

// Bind the contract
transformUser = bindContract(transformUserContract)(transformUser);

module.exports = { transformUser, User, transformUserContract };
