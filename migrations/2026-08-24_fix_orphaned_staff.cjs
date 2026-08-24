/**
 * Repair script: re-links staff_users / user_roles rows that still point at
 * stale Supabase-era auth UUIDs which do not exist in this database's
 * auth.users table. This is why staff logins fail on production while
 * working locally.
 *
 * What it does (idempotent, transactional, non-destructive):
 *  1. For every staff_users row whose auth_user_id has no matching auth.users
 *     row, it looks up a matching auth.users row by email.
 *     - Found      -> re-points auth_user_id and migrates any orphaned
 *                     user_roles entries to the real id.
 *     - Not found  -> if plain_password exists on the staff row, creates a
 *                     proper auth.users account using a bcrypt hash of that
 *                     password, then links and assigns the 'staff' role.
 *     - Otherwise  -> leaves untouched and reports it for manual action.
 *  2. Never deletes rows and never touches existing valid links.
 *
 * Usage:
 *   node migrations/2026-08-24_fix_orphaned_staff.cjs           (apply)
 *   node migrations/2026-08-24_fix_orphaned_staff.cjs --dry-run (report only)
 *
 * Requires DATABASE_URL to be set in the environment.
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DRY_RUN = process.argv.includes('--dry-run');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    'ERROR: DATABASE_URL is not set.\n' +
      'Run with:  DATABASE_URL="postgresql://user:pass@host:5432/db" node ' +
      __filename
  );
  process.exit(1);
}

async function main() {
  const c = new Client({ connectionString, connectionTimeoutMillis: 15000 });
  await c.connect();
  console.log(`Connected.${DRY_RUN ? ' (dry run — no changes will be applied)' : ''}`);

  try {
    await c.query('BEGIN');

    // Stale staff rows: auth_user_id does not exist in auth.users
    const stale = await c.query(`
      SELECT s.id, s.name, s.email, s.auth_user_id, s.plain_password
      FROM public.staff_users s
      LEFT JOIN auth.users u ON u.id = s.auth_user_id
      WHERE u.id IS NULL
    `);

    if (stale.rows.length === 0) {
      console.log('No stale staff_users rows found. Nothing to do.');
    }

    let fixedLinks = 0;
    let createdAccounts = 0;
    let migratedRoles = 0;

    for (const staff of stale.rows) {
      const emailMatch = await c.query(
        'SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1',
        [staff.email]
      );

      if (emailMatch.rows.length > 0) {
        const realId = emailMatch.rows[0].id;
        console.log(
          `- ${staff.email}: stale link ${staff.auth_user_id} -> existing auth user ${realId}`
        );
        if (!DRY_RUN) {
          await c.query('UPDATE public.staff_users SET auth_user_id = $1, updated_at = now() WHERE id = $2', [realId, staff.id]);
        }
        fixedLinks++;

        // Migrate orphaned role grants from the stale uuid to the real one
        const orphanRoles = await c.query(
          `SELECT r.id, r.role FROM public.user_roles r
           LEFT JOIN auth.users u ON u.id = r.user_id
           WHERE u.id IS NULL AND r.user_id = $1`,
          [staff.auth_user_id]
        );
        for (const role of orphanRoles.rows) {
          const dup = await c.query(
            'SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role::text = $2',
            [realId, role.role]
          );
          if (dup.rows.length === 0) {
            console.log(`    role '${role.role}' -> re-pointed to ${realId}`);
            if (!DRY_RUN) {
              await c.query('UPDATE public.user_roles SET user_id = $1 WHERE id = $2', [realId, role.id]);
            }
          } else {
            console.log(`    role '${role.role}' already present for real user; leaving orphan row in place`);
          }
          migratedRoles++;
        }
      } else if (staff.plain_password) {
        // No auth account exists — create one from the stored plaintext copy,
        // then delete the plaintext copy so it lives only as a bcrypt hash.
        const hash = await bcrypt.hash(staff.plain_password, 10);
        console.log(`- ${staff.email}: no auth user; creating one (password hashed, plaintext column cleared)`);
        if (!DRY_RUN) {
          const ins = await c.query(
            `INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password
             RETURNING id`,
            [staff.email.toLowerCase(), hash, JSON.stringify({ full_name: staff.name })]
          );
          const newId = ins.rows[0].id;
          await c.query('UPDATE public.staff_users SET auth_user_id = $1, plain_password = NULL, updated_at = now() WHERE id = $2', [newId, staff.id]);
          await c.query(
            "INSERT INTO public.user_roles (user_id, role) VALUES ($1, 'staff') ON CONFLICT (user_id, role) DO NOTHING",
            [newId]
          );
        }
        createdAccounts++;
      } else {
        console.log(
          `! ${staff.email}: cannot auto-repair (no matching auth user, no stored password). ` +
            'Reset this staff password manually via Admin > Staff after linking manually.'
        );
      }
    }

    // Final report: remaining orphans (informational only, never deleted)
    const remainingRoles = await c.query(`
      SELECT r.user_id, r.role FROM public.user_roles r
      LEFT JOIN auth.users u ON u.id = r.user_id
      WHERE u.id IS NULL
    `);
    if (remainingRoles.rows.length > 0) {
      console.log('\nOrphaned user_roles rows left untouched (reference no user):');
      for (const r of remainingRoles.rows) {
        console.log(`  - ${r.role}: ${r.user_id}`);
      }
    }

    if (DRY_RUN) {
      await c.query('ROLLBACK');
      console.log(`\nDry run complete. Would fix links: ${fixedLinks}, would create accounts: ${createdAccounts}, roles migrated: ${migratedRoles}`);
    } else {
      await c.query('COMMIT');
      console.log(`\nDone. Links fixed: ${fixedLinks}, accounts created: ${createdAccounts}, roles migrated: ${migratedRoles}. Existing data preserved.`);
    }
  } catch (err) {
    await c.query('ROLLBACK').catch(() => {});
    console.error('Migration failed, rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}

main();
