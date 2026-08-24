const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Example:');
  console.error('  DATABASE_URL="postgresql://user:pass@host:5432/db" node seed-admin.cjs');
  process.exit(1);
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
  process.exit(1);
}

const client = new Client(DATABASE_URL);

async function main() {
  await client.connect();
  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const res = await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
      VALUES (gen_random_uuid(), $1, $2, '{}'::jsonb)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [ADMIN_EMAIL, hash]);
    if (res.rows.length === 0) {
      console.log("Admin user already exists:", ADMIN_EMAIL);
      return;
    }
    const id = res.rows[0].id;
    await client.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin') ON CONFLICT DO NOTHING", [id]);
    console.log("Admin created with id:", id);
    console.log("Email:", ADMIN_EMAIL);
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await client.end();
  }
}
main();
