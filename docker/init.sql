-- Initialize databases and extensions for CourseAI
-- This script runs when the PostgreSQL container starts

-- Create the shadow database for Prisma migrations if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'prisma_shadow') THEN
      CREATE DATABASE prisma_shadow;
   END IF;
END
$do$;

-- Switch to the courseai database
\c courseai;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";  -- For fuzzy string matching
CREATE EXTENSION IF NOT EXISTS "hstore";         -- For key-value data storage
CREATE EXTENSION IF NOT EXISTS "vector";         -- For vector similarity search

-- Switch to the shadow database and enable extensions there too
\c prisma_shadow;

-- Enable necessary extensions in shadow database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";  -- For fuzzy string matching
CREATE EXTENSION IF NOT EXISTS "hstore";         -- For key-value data storage
CREATE EXTENSION IF NOT EXISTS "vector";         -- For vector similarity search

-- Switch back to the courseai database
\c courseai;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO postgress;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO postgress;

-- Create a function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';