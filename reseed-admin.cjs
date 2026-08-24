const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
  process.exit(1);
}

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 30000
  });
  await c.connect();

  // Delete old admin if exists so we get a fresh bcryptjs hash
  await c.query('DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = $1)', [EMAIL]);
  await c.query('DELETE FROM auth.users WHERE email = $1', [EMAIL]);

  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log('Hash generated:', hash.substring(0, 20) + '...');

  const res = await c.query(
    "INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data) VALUES (gen_random_uuid(), $1, $2, '{}'::jsonb) RETURNING id",
    [EMAIL, hash]
  );
  const id = res.rows[0].id;
  await c.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin')", [id]);

  // Verify bcryptjs can read it back
  const check = await c.query('SELECT encrypted_password FROM auth.users WHERE id = $1', [id]);
  const match = await bcrypt.compare(PASSWORD, check.rows[0].encrypted_password);
  console.log('Password verify:', match ? 'PASS' : 'FAIL');
  console.log('Admin re-seeded with id:', id);
  await c.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
