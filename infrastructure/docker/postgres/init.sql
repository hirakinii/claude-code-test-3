-- PostgreSQL initialization script
-- This script runs when the database is first created

-- Ensure UTF-8 encoding
SET client_encoding = 'UTF8';

-- Create extensions if needed (can be added later)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Database is already created by POSTGRES_DB environment variable
-- This file is for additional initialization if needed

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL database initialized successfully';
END
$$;
