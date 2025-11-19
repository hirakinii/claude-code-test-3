-- PostgreSQL initialization script
-- This script runs when the database is first created

-- Ensure UTF-8 encoding
SET client_encoding = 'UTF8';

-- Database is already created by POSTGRES_DB environment variable
-- Create additional test database
CREATE DATABASE spec_management_test
    WITH
    OWNER = spec_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

GRANT ALL PRIVILEGES ON DATABASE spec_management_test TO spec_user;

-- Create extensions if needed (can be added later)
-- Switch to main database for extensions
\c spec_management_db;
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch to test database for extensions
\c spec_management_test;
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL databases initialized successfully';
  RAISE NOTICE 'Created databases: spec_management_db (main), spec_management_test (test)';
END
$$;
