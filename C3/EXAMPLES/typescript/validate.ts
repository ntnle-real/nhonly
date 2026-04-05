// MARK: CONSTRAINT(Input) -> Validate Email Address
// Purpose: Validate that an email address is well-formed.
// Success: Email is validated (contains @ and domain), no exceptions raised.
// Failure: Email is invalid (missing @, no domain, or empty), Error thrown.

interface ValidateEmailContract {
  serves: string;
  declares: {
    input: "email";
    output: "isValid";
  };
  succeeds_if: {
    reads: ["email"];
    steps: ["check_format", "check_domain"];
    observes: ["email_valid"];
    returns: ["isValid"];
  };
  fails_if: {
    observes: ["email_invalid"];
  };
}

const validateEmailContract: ValidateEmailContract = {
  serves: "validate that an email address is well-formed",
  declares: {
    input: "email",
    output: "isValid",
  },
  succeeds_if: {
    reads: ["email"],
    steps: ["check_format", "check_domain"],
    observes: ["email_valid"],
    returns: ["isValid"],
  },
  fails_if: {
    observes: ["email_invalid"],
  },
};

function validateEmail(email: string, obs: ObservationSession): boolean {
  /**
   * Validate an email address.
   *
   * @param email - Email string to validate
   * @param obs - Observation session (injected)
   * @returns isValid - True if email is valid
   * @throws {Error} If email is invalid
   */

  // Read input
  obs.read("email", email);

  // Step 1: Check format
  obs.step("check_format");
  if (!email || !email.includes("@")) {
    obs.observe("email_invalid", `missing @ symbol: ${email}`);
    throw new Error("Email must contain @ symbol");
  }

  // Step 2: Check domain
  obs.step("check_domain");
  const [local, domain] = email.split("@");
  if (!local || !domain || !domain.includes(".")) {
    obs.observe("email_invalid", `invalid domain: ${domain}`);
    throw new Error("Email must have valid domain");
  }

  // Record success
  obs.observe("email_valid", `email=${email}`);

  // Return result
  return obs.return_<boolean>("isValid", true);
}

// Bind the contract to the function
const validateEmailBound = bindContract(validateEmailContract)(validateEmail);

export { validateEmailBound as validateEmail, validateEmailContract };
