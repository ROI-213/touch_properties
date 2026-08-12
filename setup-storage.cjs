const { Client } = require('pg');

const client = new Client('postgres://touch590:ia1MVU8W0kU1Q347NF6aDNkHy@168.119.64.101:5432/touch590');

async function main() {
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.custom_storage (
        id SERIAL PRIMARY KEY,
        bucket VARCHAR(255) NOT NULL,
        path VARCHAR(1024) NOT NULL,
        data BYTEA NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(bucket, path)
      );
    `);
    console.log("Storage table created successfully.");
  } catch (err) {
    console.error("Error creating storage table:", err);
  } finally {
    await client.end();
  }
}
main();
