# MARK: CONSTRAINT(Input) -> Validate Email Address
# Purpose: Validate that an email address is well-formed.
# Success: Email is validated (contains @ and domain), no exceptions raised.
# Failure: Email is invalid (missing @, no domain, or empty), ValueError raised.

from typing import Optional

# Contract declaration
validate_email_contract = (
    this_function
    .serves("validate that an email address is well-formed")
    .declares("email", "is_valid")
    .succeeds_if(
        reads("email"),
        steps("check_format", "check_domain"),
        observes("email_valid"),
        returns("is_valid"),
    )
    .fails_if(
        observes("email_invalid"),
    )
)


def validate_email(email: str, *, obs) -> bool:
    """Validate an email address.

    Args:
        email: Email string to validate
        obs: Observation session (injected)

    Returns:
        is_valid: True if email is valid, False otherwise

    Raises:
        ValueError: If email is None or empty string
    """
    # Read input
    obs.read("email", email)

    # Step 1: Check format
    obs.step("check_format")
    if not email or "@" not in email:
        obs.observe("email_invalid", f"missing @ symbol: {email}")
        raise ValueError("Email must contain @ symbol")

    # Step 2: Check domain
    obs.step("check_domain")
    local, domain = email.rsplit("@", 1)
    if not local or not domain or "." not in domain:
        obs.observe("email_invalid", f"invalid domain: {domain}")
        raise ValueError("Email must have valid domain")

    # Record success
    obs.observe("email_valid", f"email={email}")

    # Return result
    return obs.return_("is_valid", True)

# Bind the contract to the function
validate_email = observed_by(validate_email_contract)(validate_email)


# Example usage (not part of contract, just shows how to call):
if __name__ == "__main__":
    # Success case
    try:
        result = validate_email("user@example.com", obs=obs_session)
        print(f"Valid: {result}")
    except ValueError as e:
        print(f"Invalid: {e}")

    # Failure case
    try:
        result = validate_email("invalid-email", obs=obs_session)
    except ValueError as e:
        print(f"Invalid: {e}")
