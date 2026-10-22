import { Pool, Client, types } from "pg";

// Return PostgreSQL DATE (1082) as 'YYYY-MM-DD' strings and TIMESTAMP/TIMESTAMPTZ
// (1114/1184) as ISO strings so React components never receive raw Date objects
// over RPC that crash JSX rendering ("Objects are not valid as a React child").
types.setTypeParser(1082, (val: string) => val);
types.setTypeParser(1114, (val: string) => val);
types.setTypeParser(1184, (val: string) => val);

const defaultRemoteUrl = Buffer.from(
  "cG9zdGdyZXNxbDovL3RvdWNoNTkwOmlhMU1WVThXMGtVMVEzNDdORjZhRE5rSHlAdG91Y2hzdG9uZXByb3BlcnRpZXMuaW46NTQzMi90b3VjaDU5MA==",
  "base64",
).toString("utf-8");

const rawConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PGURI ||
  defaultRemoteUrl;

const remoteConnectionString = rawConnectionString.replace(
  "@127.0.0.1:5432",
  "@touchstoneproperties.in:5432",
);

const isRemoteRuntime =
  process.env.NODE_ENV !== "production" || Boolean(process.env.VERCEL);

const connectionString = isRemoteRuntime
  ? remoteConnectionString
  : rawConnectionString;

const isExplicitNoSsl =
  process.env.PGSSL === "false" ||
  connectionString.includes("@touchstoneproperties.in:5432");

const globalForPg = globalThis as unknown as {
  __tsPgPool?: Pool;
  __tsLastIdleReap?: number;
};

const pool =
  globalForPg.__tsPgPool ??
  new Pool({
    connectionString,
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 4000,
    max: process.env.VERCEL ? 2 : 4,
    allowExitOnIdle: true,
    ssl: isExplicitNoSsl ? false : { rejectUnauthorized: false },
  });

if (!globalForPg.__tsPgPool) {
  globalForPg.__tsPgPool = pool;

  pool.on("error", (err) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[pg.Pool background error]:", err.message);
    }
  });

  // Automatically reap abandoned idle connections (>20s idle) from serverless/dev instances
  // so PostgreSQL max_connections (100) is never exhausted.
  pool.on("connect", (client) => {
    const now = Date.now();
    if (now - (globalForPg.__tsLastIdleReap || 0) < 15000) return;
    globalForPg.__tsLastIdleReap = now;
    client
      .query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = current_database()
           AND usename = current_user
           AND pid <> pg_backend_pid()
           AND state = 'idle'
           AND state_change < NOW() - INTERVAL '20 seconds'`,
      )
      .catch(() => {});
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const query = async (text: string, params?: unknown[]) => {
  try {
    return await pool.query(text, params as never[]);
  } catch (err) {
    const e = err as { message?: string; code?: string };
    const msg = String(e?.message || "").toLowerCase();
    const isSlotExhausted =
      e?.code === "53300" ||
      msg.includes("remaining connection slots") ||
      msg.includes("too many clients");
    const isSslErr =
      msg.includes("ssl") ||
      msg.includes("tlssocket") ||
      msg.includes("handshake");
    const isConnErr =
      isSlotExhausted ||
      msg.includes("terminated") ||
      msg.includes("closed") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("timeout expired");

    if (isSslErr || isConnErr) {
      const targetConnStr = msg.includes("econnrefused")
        ? remoteConnectionString
        : connectionString;

      let lastErr: unknown = err;
      const attempts = isSlotExhausted ? 3 : 1;
      for (let i = 0; i < attempts; i++) {
        if (i > 0 || isSlotExhausted) {
          await sleep(400 * (i + 1));
        }
        const fallbackClient = new Client({
          connectionString: targetConnStr,
          connectionTimeoutMillis: 8000,
          ssl:
            isSslErr || targetConnStr.includes("@touchstoneproperties.in:5432")
              ? false
              : isExplicitNoSsl
                ? false
                : { rejectUnauthorized: false },
        });
        try {
          await fallbackClient.connect();
          try {
            if (isSlotExhausted) {
              await fallbackClient
                .query(
                  `SELECT pg_terminate_backend(pid)
                   FROM pg_stat_activity
                   WHERE datname = current_database()
                     AND usename = current_user
                     AND pid <> pg_backend_pid()
                     AND state = 'idle'
                     AND state_change < NOW() - INTERVAL '5 seconds'`,
                )
                .catch(() => {});
            }
            return await fallbackClient.query(text, params as never[]);
          } finally {
            await fallbackClient.end().catch(() => {});
          }
        } catch (retryErr) {
          lastErr = retryErr;
        }
      }
      throw lastErr;
    }
    throw err;
  }
};

export const getClient = async () => {
  try {
    return await pool.connect();
  } catch (err) {
    const fallbackClient = new Client({
      connectionString: remoteConnectionString,
      connectionTimeoutMillis: 8000,
      ssl: false,
    });
    await fallbackClient.connect();
    return fallbackClient;
  }
};
