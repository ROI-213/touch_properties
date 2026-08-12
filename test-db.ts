import { query } from "./src/server/db.ts";

async function test() {
  try {
    const res = await query("SELECT * FROM auth.users WHERE email = $1", ["admin@test.com"]);
    console.log("User:", res.rows[0]);
    const uid = res.rows[0].id;
    
    // test the user_roles query exactly as db.functions.ts does
    const sql = "SELECT * FROM user_roles WHERE user_id = $1 AND role = $2";
    const res2 = await query(sql, [uid, "admin"]);
    console.log("Role:", res2.rows);

    // test the staff_users query exactly as db.functions.ts does
    const sql3 = "SELECT id,status FROM staff_users WHERE auth_user_id = $1";
    const res3 = await query(sql3, [uid]);
    console.log("Staff:", res3.rows);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit(0);
  }
}
test();
