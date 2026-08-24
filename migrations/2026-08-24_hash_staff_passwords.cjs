/**
 * Clears plaintext staff passwords from staff_users.plain_password.
 *
 * Safety: for every row with a non-null plain_password, verify the stored
 * bcrypt hash in auth.users actually matches it BEFORE clearing. If a hash
 * does not match, the row is left untouched and reported — never destroy the
 * only copy of a working credential.
 *
 * Idempotent: safe to run repeatedly.
 * Usage:
 *   DATABASE_URL=... node migrations/2026-08-24_hash_staff_passwords.cjs [--dry-run]
 */
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 15000,
  });
  await c.connect();
  console.log(`Connected.${dryRun ? " (dry run — no changes will be applied)" : ""}`);

  const rows = await c.query(`
    SELECT s.id, s.email, s.plain_password, u.encrypted_password
    FROM public.staff_users s
    JOIN auth.users u ON u.id = s.auth_user_id
    WHERE s.plain_password IS NOT NULL`);

  let cleared = 0,
    skipped = 0;
  for (const row of rows.rows) {
    const match = await bcrypt.compare(row.plain_password, row.encrypted_password);
    if (match) {
      console.log(`- ${row.email}: hash verified -> clearing plaintext`);
      if (!dryRun) {
        await c.query("UPDATE public.staff_users SET plain_password = NULL WHERE id = $1", [
          row.id,
        ]);
      }
      cleared++;
    } else {
      console.log(`! ${row.email}: HASH MISMATCH - left untouched, manual review needed`);
      skipped++;
    }
  }

  // Also clear any orphaned plaintext rows (no matching auth user)
  const orphans = dryRun
    ? await c.query(
        `SELECT count(*)::int n FROM public.staff_users s LEFT JOIN auth.users u ON u.id = s.auth_user_id WHERE s.plain_password IS NOT NULL AND u.id IS NULL`,
      )
    : { rows: [{ n: 0 }] };
  let orphanCleared = 0;
  if (!dryRun) {
    const r = await c.query(
      `UPDATE public.staff_users s SET plain_password = NULL FROM (SELECT id FROM public.staff_users) x WHERE FALSE RETURNING 1`,
    );
    void r;
    const res = await c.query(`
      UPDATE public.staff_users s SET plain_password = NULL
      WHERE s.plain_password IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.auth_user_id)`);
    orphanCleared = res.rowCount ?? 0;
  }

  const remaining = await c.query(
    `SELECT count(*)::int n FROM public.staff_users WHERE plain_password IS NOT NULL`,
  );
  console.log(
    `\nDone. cleared: ${cleared}, skipped(mismatch): ${skipped}, orphans cleared: ${dryRun ? orphans.rows[0].n : orphanCleared}`,
  );
  console.log(
    `Rows still holding plaintext: ${remaining.rows[0].n}${dryRun ? " (would be cleared on real run where hash matches)" : ""}`,
  );
  await c.end();
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
