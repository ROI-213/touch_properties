const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client('postgres://touch590:ia1MVU8W0kU1Q347NF6aDNkHy@168.119.64.101:5432/touch590');

async function main() {
  await client.connect();
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const res = await client.query(`
      INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
      VALUES (gen_random_uuid(), 'admin@test.com', $1, '{}'::jsonb)
      RETURNING id
    `, [hash]);
    const id = res.rows[0].id;
    await client.query("INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'admin')", [id]);
    console.log("Admin created with id:", id);
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await client.end();
  }
}
main();
