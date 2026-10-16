import { Pool, Client } from "pg";

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
      const targetConnStr = msg.includes("econnrefused")
        ? remoteConnectionString
        : connectionString;
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
      connectionString: remoteConnectionString,
      connectionTimeoutMillis: 8000,
      ssl: false,
    });
    await fallbackClient.connect();
    return fallbackClient;
  }
};
