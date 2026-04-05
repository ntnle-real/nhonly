-- MARK: CONSTRAINT(Input) -> Validate Email Address
-- Purpose: Validate that an email address is well-formed using database constraints.
-- Success: Email passes CHECK constraints (contains @, has domain).
-- Failure: Email violates constraints (missing @, invalid domain, empty string).

-- @serves "validate email addresses at the database level"
-- @declares "email" "is_valid"
-- @succeeds_if "reads email" "returns is_valid"

CREATE TABLE email_validation (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Input column: the email to validate
    email VARCHAR(255) NOT NULL,

    -- Output column: validation result
    is_valid BOOLEAN DEFAULT TRUE,

    -- SUCCESS conditions as CHECK constraints
    CHECK (LENGTH(email) > 0),              -- email must not be empty
    CHECK (POSITION('@' IN email) > 0),     -- email must contain @
    CHECK (POSITION('.' IN email) > POSITION('@' IN email)), -- domain must have .

    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint to prevent duplicates
    UNIQUE KEY uk_email (email)
);

-- Example: Validate a single email
-- @serves "validate one email address"
-- @declares "user_email" "is_valid"
-- @succeeds_if "reads user_email" "returns is_valid"

DELIMITER //
CREATE FUNCTION validate_email(user_email VARCHAR(255))
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    -- Step 1: Check format
    IF LENGTH(user_email) = 0 OR POSITION('@' IN user_email) = 0 THEN
        -- Failure observation
        RETURN FALSE;
    END IF;

    -- Step 2: Check domain
    IF POSITION('.' IN user_email) <= POSITION('@' IN user_email) THEN
        -- Failure observation
        RETURN FALSE;
    END IF;

    -- Success observation
    RETURN TRUE;
END //
DELIMITER ;

-- Example usage:
-- SELECT email, validate_email(email) AS is_valid
-- FROM users
-- WHERE validate_email(email) = FALSE;
