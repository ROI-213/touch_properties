import { Pool, Client } from "pg";

// Read connection string strictly from environment variables in production.
// Fallback connection string is used for local development when env vars are omitted.
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PGURI || "";

if (!connectionString) {
  throw new Error(
    "[db] No database connection string found. Set DATABASE_URL (or POSTGRES_URL / PGURI) in your environment.",
  );
}

const isExplicitNoSsl = process.env.PGSSL === "false";

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  ssl: isExplicitNoSsl ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[pg.Pool background error]:", err.message);
  }
});

export const query = async (text: string, params?: unknown[]) => {
  try {
    return await pool.query(text, params as never[]);
  } catch (err) {
    const e = err as { message?: string };
    const msg = String(e?.message || "").toLowerCase();
    const isSslErr = msg.includes("ssl") || msg.includes("tlssocket") || msg.includes("handshake");
    const isConnErr =
      msg.includes("terminated") ||
      msg.includes("closed") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      // pg Pool emits "timeout expired" when acquiring a client exceeds
      // connectionTimeoutMillis — worth one fresh-connection retry.
      msg.includes("timeout expired");

    if (isSslErr || isConnErr) {
      const fallbackClient = new Client({
        connectionString,
        connectionTimeoutMillis: 8000,
        ssl: isSslErr ? false : isExplicitNoSsl ? false : { rejectUnauthorized: false },
      });
      await fallbackClient.connect();
      try {
        return await fallbackClient.query(text, params as never[]);
      } finally {
        await fallbackClient.end().catch(() => {});
      }
    }
    throw err;
  }
};

export const getClient = async () => {
  try {
    return await pool.connect();
  } catch (err) {
    const fallbackClient = new Client({
      connectionString,
      connectionTimeoutMillis: 8000,
      ssl: false,
    });
    await fallbackClient.connect();
    return fallbackClient;
  }
};
