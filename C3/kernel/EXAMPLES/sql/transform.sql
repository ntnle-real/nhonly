-- MARK: CONDUCT(Processor) -> Transform User Record
-- Purpose: Transform raw user data into normalized form using database operations.
-- Success: Normalized user record is created with validated data.
-- Failure: Required fields missing, type conversion fails, or validation error.

-- @serves "transform raw user data into normalized form"
-- @declares "raw_user" "normalized_user"
-- @succeeds_if "reads raw_user" "returns normalized_user"

-- Step 1: Create normalized user table (the output schema)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Output columns (normalized)
    user_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- SUCCESS conditions as CHECK constraints
    CHECK (LENGTH(user_id) > 0),            -- user_id is required
    CHECK (LENGTH(email) > 0),              -- email is required
    CHECK (LENGTH(name) > 0),               -- name is required
    CHECK (POSITION('@' IN email) > 0),     -- email format valid

    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    UNIQUE KEY uk_user_id (user_id),
    UNIQUE KEY uk_email (email)
);

-- Step 2: Create stored procedure to transform raw data
-- @serves "transform raw user into normalized user"
-- @declares "p_user_id, p_email, p_name, p_active" "normalized_user_id"

DELIMITER //
CREATE PROCEDURE transform_user(
    IN p_user_id VARCHAR(36),
    IN p_email VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_active BOOLEAN,
    OUT p_normalized_id INT
)
BEGIN
    -- Declare error handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Failure observation
        SET p_normalized_id = NULL;
    END;

    -- Step 1: Extract and validate fields
    -- Validate required fields
    IF p_user_id IS NULL OR p_email IS NULL OR p_name IS NULL THEN
        -- missing_required_field observation
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'id, email, or name is missing';
    END IF;

    -- Step 2: Normalize email
    SET p_email = LOWER(TRIM(p_email));

    -- Validate email format
    IF POSITION('@' IN p_email) = 0 THEN
        -- invalid_email observation
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email format';
    END IF;

    -- Step 3: Validate user
    -- Coerce active to boolean
    SET p_active = IFNULL(p_active, TRUE);

    -- Insert the normalized user
    INSERT INTO users (user_id, email, name, is_active)
    VALUES (p_user_id, p_email, p_name, p_active);

    -- Success observation: transformation_complete
    SET p_normalized_id = LAST_INSERT_ID();
END //
DELIMITER ;

-- Example usage:
-- CALL transform_user('user-123', 'John@Example.COM', 'John Doe', TRUE, @normalized_id);
-- SELECT @normalized_id;
-- SELECT * FROM users WHERE id = @normalized_id;
