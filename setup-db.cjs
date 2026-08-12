const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://touch590:ia1MVU8W0kU1Q347NF6aDNkHy@168.119.64.101:5432/touch590';

const initSql = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  -- A placeholder since we enforce auth at the application layer now
  SELECT NULL::UUID;
$$ LANGUAGE SQL STABLE;

CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT NOT NULL,
  owner UUID REFERENCES auth.users(id),
  metadata JSONB,
  path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  file_data BYTEA,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bucket_id, name)
);
`;

async function runMigrations() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to database successfully.");

    // Run Init SQL
    console.log("Running initialization SQL (auth/storage schemas)...");
    await client.query(initSql);
    console.log("Init SQL completed.");

    // Read migrations
    const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
    let files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files.sort(); // Run in order

    for (const file of files) {
      console.log("Running migration: " + file);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await client.query(sql);
        console.log("Successfully ran " + file);
      } catch (err) {
        console.error("Error running " + file + ":", err.message);
      }
    }

    console.log("All migrations finished.");

  } catch (err) {
    console.error("Database connection/execution error:", err);
  } finally {
    await client.end();
  }
}

runMigrations();
