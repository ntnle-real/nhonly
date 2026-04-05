# MARK: CONDUCT(Processor) -> Transform User Record
# Purpose: Transform raw user data into a normalized user object.
# Success: User object created with all required fields populated and validated.
# Failure: Required fields missing, type conversion fails, or normalization error.

from dataclasses import dataclass
from typing import Optional

# Contract declaration
transform_user_contract = (
    this_function
    .serves("transform raw user data into normalized user object")
    .declares("raw_user", "normalized_user")
    .succeeds_if(
        reads("raw_user"),
        steps("extract_fields", "normalize_email", "validate_user"),
        observes("transformation_complete"),
        returns("normalized_user"),
    )
    .fails_if(
        observes("missing_required_field"),
        observes("invalid_email"),
        observes("validation_error"),
    )
)

@dataclass
class User:
    """Normalized user object."""
    id: str
    email: str
    name: str
    is_active: bool

def transform_user(raw_user: dict, *, obs) -> User:
    """Transform raw user dict into normalized User object.

    Args:
        raw_user: Dictionary with keys: id, email, name, active
        obs: Observation session (injected)

    Returns:
        normalized_user: User dataclass instance

    Raises:
        ValueError: If required fields are missing or invalid
    """
    # Read input
    obs.read("raw_user", raw_user)

    # Step 1: Extract fields
    obs.step("extract_fields")
    try:
        user_id = raw_user.get("id")
        email = raw_user.get("email")
        name = raw_user.get("name")
        is_active = raw_user.get("active", True)
    except Exception as e:
        obs.observe("missing_required_field", str(e))
        raise ValueError(f"Failed to extract fields: {e}")

    if not user_id or not email or not name:
        obs.observe("missing_required_field", "id, email, or name is missing")
        raise ValueError("id, email, and name are required")

    # Step 2: Normalize email
    obs.step("normalize_email")
    email = email.lower().strip()
    if "@" not in email:
        obs.observe("invalid_email", email)
        raise ValueError(f"Invalid email: {email}")

    # Step 3: Validate user
    obs.step("validate_user")
    if not isinstance(is_active, bool):
        is_active = bool(is_active)

    obs.observe("transformation_complete", f"user_id={user_id}, email={email}")

    # Create and return normalized user
    normalized_user = User(id=user_id, email=email, name=name, is_active=is_active)
    return obs.return_("normalized_user", normalized_user)

# Bind the contract
transform_user = observed_by(transform_user_contract)(transform_user)
