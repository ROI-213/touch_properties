import { Pool, Client } from 'pg';

// Read connection string strictly from environment variables in production.
// Fallback connection string is used for local development when env vars are omitted.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PGURI ||
  'postgresql://touch590:ia1MVU8W0kU1Q347NF6aDNkHy@168.119.64.101:5432/touch590';

const isExplicitNoSsl = process.env.PGSSL === "false";

let pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  ssl: isExplicitNoSsl ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[pg.Pool background error]:', err.message);
  }
});

export const query = async (text: string, params?: any[]) => {
  try {
    return await pool.query(text, params);
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    const isSslErr = msg.includes('ssl') || msg.includes('tlssocket') || msg.includes('handshake');
    const isConnErr = msg.includes('terminated') || msg.includes('closed') || msg.includes('econnrefused') || msg.includes('etimedout');

    if (isSslErr || isConnErr) {
      try {
        const fallbackClient = new Client({
          connectionString,
          connectionTimeoutMillis: 8000,
          ssl: isSslErr ? false : (isExplicitNoSsl ? false : { rejectUnauthorized: false }),
        });
        await fallbackClient.connect();
        const res = await fallbackClient.query(text, params);
        await fallbackClient.end().catch(() => {});
        return res;
      } catch (fallbackErr: any) {
        throw fallbackErr;
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
