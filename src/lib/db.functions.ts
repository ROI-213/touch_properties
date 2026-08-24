import { createServerFn } from "@tanstack/react-start";
import { query as dbQuery } from "@/server/db";
import { getRequestAuth, isOperator } from "@/lib/server-auth";

// ---------------------------------------------------------------------------
// Security gateway
//
// executeDbQueryFn is the single entry point used by the browser-side
// "supabase-like" client. Because it builds raw SQL, every identifier coming
// from the wire must be strictly validated and every table must be explicitly
// whitelisted with an access policy. Values are always parameterized; only
// identifiers reach string interpolation, and they are validated below.
// ---------------------------------------------------------------------------

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Tables this application is allowed to touch via the generic gateway. */
const TABLES = new Set<string>([
  // Public marketing / CMS content
  "properties",
  "property_images",
  "property_configurations",
  "property_prices",
  "property_nearby",
  "property_amenities",
  "builders",
  "locations",
  "amenities",
  "banners",
  "testimonials",
  "success_stories",
  "faqs",
  "form_options",
  "content_sections",
  "site_settings",
  "contact_info",
  "contact_notes",
  "partners",
  "navigation_items",
  "hot_property_settings",
  "notifications",
  "seo_metadata",
  "property_assignments",
  // Lead capture
  "enquiries",
  "sell_property_enquiries",
  // User-scoped
  "profiles",
  "wishlists",
  // Operators
  "staff_users",
  "staff_permissions",
  "staff_tasks",
  "activity_logs",
  "user_roles",
]);

type Level = "public" | "auth" | "operator";

interface TablePolicy {
  select: Level;
  insert: Level;
  update: Level;
  delete: Level;
}

const PUBLIC_ALL: TablePolicy = {
  select: "public",
  insert: "operator",
  update: "operator",
  delete: "operator",
};

const POLICIES: Record<string, TablePolicy> = {
  properties: PUBLIC_ALL,
  property_images: PUBLIC_ALL,
  property_configurations: PUBLIC_ALL,
  property_prices: PUBLIC_ALL,
  property_nearby: PUBLIC_ALL,
  property_amenities: PUBLIC_ALL,
  builders: PUBLIC_ALL,
  locations: PUBLIC_ALL,
  amenities: PUBLIC_ALL,
  banners: PUBLIC_ALL,
  testimonials: PUBLIC_ALL,
  success_stories: PUBLIC_ALL,
  faqs: PUBLIC_ALL,
  form_options: PUBLIC_ALL,
  content_sections: PUBLIC_ALL,
  site_settings: PUBLIC_ALL,
  contact_info: PUBLIC_ALL,
  partners: PUBLIC_ALL,
  navigation_items: PUBLIC_ALL,
  hot_property_settings: PUBLIC_ALL,
  seo_metadata: PUBLIC_ALL,
  notifications: PUBLIC_ALL,
  contact_notes: {
    select: "public",
    insert: "operator",
    update: "operator",
    delete: "operator",
  },
  property_assignments: PUBLIC_ALL,

  // Lead capture: anyone may submit, only operators may read/manage.
  enquiries: {
    select: "auth",
    insert: "public",
    update: "operator",
    delete: "operator",
  },
  sell_property_enquiries: {
    select: "operator",
    insert: "public",
    update: "operator",
    delete: "operator",
  },

  // User-scoped data requires a signed-in session.
  profiles: { select: "auth", insert: "auth", update: "auth", delete: "auth" },
  wishlists: { select: "auth", insert: "auth", update: "auth", delete: "auth" },

  activity_logs: { select: "operator", insert: "auth", update: "operator", delete: "operator" },
  staff_tasks: { select: "operator", insert: "operator", update: "operator", delete: "operator" },
  staff_permissions: { select: "auth", insert: "operator", update: "operator", delete: "operator" },
  user_roles: { select: "auth", insert: "operator", update: "operator", delete: "operator" },
  staff_users: { select: "auth", insert: "operator", update: "operator", delete: "operator" },
};

/**
 * Columns that must never leave the server unless the requester is an
 * operator (admin/active staff).
 */
const SENSITIVE_COLUMNS = new Set(["plain_password", "encrypted_password"]);

function levelFor(policy: TablePolicy, op: "select" | "insert" | "update" | "delete"): Level {
  if (op === "select") return policy.select;
  if (op === "insert") return policy.insert;
  if (op === "update") return policy.update;
  return policy.delete;
}

function assertIdent(name: string, context: string): string {
  if (!IDENT_RE.test(name)) {
    throw new Error(`Invalid identifier "${name}" in ${context}`);
  }
  return name;
}

// PostgREST select syntax like "*, location:locations(zone, locality)" is not
// valid in raw Postgres. RETURNING must use plain column expressions, so strip
// relationship aliases ("alias:relation(...)") and fall back to the joined
// subqueries used by the SELECT path when a property insert/update asks for them.
function returningColumns(table: string, selectStr: string | undefined): string {
  if (!selectStr || selectStr.trim() === "") return "*";

  if (table === "properties" && selectStr.includes("locations")) {
    return [
      "*",
      "(SELECT row_to_json(b) FROM (SELECT name FROM builders WHERE id = properties.builder_id) b) as builder",
      "(SELECT row_to_json(l) FROM (SELECT zone, locality FROM locations WHERE id = properties.location_id) l) as location",
      "(SELECT coalesce(json_agg(row_to_json(img)), '[]') FROM (SELECT url, image_type FROM property_images WHERE property_id = properties.id) img) as property_images",
    ].join(", ");
  }

  const parts = selectStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = parts.filter((p) => !p.includes(":"));
  const safe = kept.map((p) => {
    // Allow plain identifiers and bare "*" only.
    if (!/^[a-zA-Z_*][a-zA-Z0-9_*.]*$/.test(p)) {
      throw new Error(`Invalid column selection "${p}"`);
    }
    return p;
  });
  return safe.length > 0 ? safe.join(", ") : "*";
}

/**
 * A SELECT list may legitimately contain identifiers, alias syntax
 * ("alias:relation(col)") and parens. It must never contain quotes,
 * semicolons, comments or dollar placeholders — those would allow SQL
 * injection through the interpolated column list.
 */
function sanitizeSelectList(selectStr: string): string {
  const trimmed = selectStr.trim();
  if (!trimmed || trimmed === "*") return "*";
  if (!/^[a-zA-Z0-9_*,.:()\s]+$/.test(trimmed)) {
    throw new Error(`Invalid column selection "${selectStr}"`);
  }
  return trimmed;
}

// Columns that are real Postgres arrays (text[] etc.). node-postgres renders
// JS arrays as PG array literals ({a,b}) which is correct for these, but is NOT
// valid JSON — so every other object/array value must be JSON.stringified to
// match PostgREST semantics for json/jsonb columns.
const PG_ARRAY_COLUMNS = new Set([
  "properties.bhk_options",
  "property_assignments.languages",
  "sell_property_enquiries.amenities",
  "sell_property_enquiries.photos",
]);

/**
 * Loose typing for the dynamic-SQL gateway. Row shapes and query payloads are
 * genuinely dynamic (driven by whitelisted table/column names at runtime), so
 * a single alias keeps that explicit instead of sprinkling `any` everywhere.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dyn = any;

function toPgParam(table: string, column: string, value: Dyn): Dyn {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") {
    if (PG_ARRAY_COLUMNS.has(table + "." + column)) return value;
    return JSON.stringify(value);
  }
  return value;
}

/** Remove sensitive columns from result rows when requester is not an operator. */
function stripSensitive(rows: Dyn[], isOperatorUser: boolean): Dyn[] {
  if (isOperatorUser || !Array.isArray(rows)) return rows;
  let stripped = false;
  const out = rows.map((row) => {
    if (!row || typeof row !== "object") return row;
    let clone: Dyn | null = null;
    for (const key of Object.keys(row)) {
      if (SENSITIVE_COLUMNS.has(key)) {
        if (!clone) clone = { ...row };
        delete clone[key];
        stripped = true;
      }
    }
    return clone ?? row;
  });
  if (stripped) console.warn("[db] sensitive columns stripped from non-operator response");
  return out;
}

type QueryType = "select" | "insert" | "update" | "delete" | "upsert";

interface DbFilter {
  column: string;
  op?: string;
  value?: Dyn;
}

interface DbOrder {
  column: string;
  ascending?: boolean;
}

export const executeDbQueryFn = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) =>
      d as {
        table: string;
        type: QueryType;
        selectStr?: string;
        filters?: DbFilter[];
        order?: DbOrder[];
        limit?: number;
        single?: boolean;
        maybeSingle?: boolean;
        payload?: Dyn;
        onConflict?: string;
        returning?: boolean;
      },
  )
  .handler(async ({ data }) => {
    try {
      const {
        table,
        type,
        selectStr,
        filters,
        order,
        limit,
        single,
        maybeSingle,
        payload,
        onConflict,
        returning,
      } = data;

      // --- Authorization -------------------------------------------------
      if (!TABLES.has(table)) {
        return { data: null, error: { message: `Unknown table "${table}"` } };
      }
      assertIdent(table, "table");
      const policy = POLICIES[table];
      const op: "select" | "insert" | "update" | "delete" = type === "upsert" ? "insert" : type;
      const requiredLevel = levelFor(policy, op);

      let userId: string | null = null;
      let isOperatorUser = false;
      if (requiredLevel !== "public") {
        const auth = getRequestAuth();
        userId = auth.userId;
        if (!userId) {
          return { data: null, error: { message: "Unauthorized: sign in required." } };
        }
        isOperatorUser = await isOperator(userId);
        if (requiredLevel === "operator" && !isOperatorUser) {
          return { data: null, error: { message: "Forbidden: insufficient permissions." } };
        }
      }

      // Staff may read their own staff_users row; listing all staff stays
      // operator-only. Enforce by requiring an auth_user_id self-filter.
      if (table === "staff_users" && type === "select" && !isOperatorUser) {
        const selfFilter = (filters ?? []).some(
          (f) => f?.op === "eq" && f?.column === "auth_user_id" && f?.value === userId,
        );
        if (!selfFilter) {
          return { data: null, error: { message: "Forbidden: insufficient permissions." } };
        }
      }

      // --- Identifier validation -----------------------------------------
      if (filters) {
        for (const f of filters) {
          if (f?.column !== undefined) assertIdent(String(f.column), "filter");
        }
      }
      if (order) {
        for (const o of order) {
          if (o?.column !== undefined) assertIdent(String(o.column), "order");
        }
      }
      if ((type === "insert" || type === "update" || type === "upsert") && payload) {
        const keys = Array.isArray(payload) ? Object.keys(payload[0] ?? {}) : Object.keys(payload);
        for (const k of keys) assertIdent(k, "payload");
      }
      if (onConflict) {
        for (const col of onConflict.split(",")) {
          if (col.trim()) assertIdent(col.trim(), "onConflict");
        }
      }

      // --- SQL building (unchanged behaviour) ------------------------------
      let sql = "";
      const params: Dyn[] = [];
      let paramIdx = 1;

      if (type === "select") {
        if (table === "properties" && selectStr && selectStr.includes("locations")) {
          sql = `
            SELECT p.*,
                   (SELECT row_to_json(b) FROM (SELECT name FROM builders WHERE id = p.builder_id) b) as builder,
                   (SELECT row_to_json(l) FROM (SELECT zone, locality FROM locations WHERE id = p.location_id) l) as location,
                   (SELECT coalesce(json_agg(row_to_json(img)), '[]') FROM (SELECT url, image_type FROM property_images WHERE property_id = p.id) img) as property_images
            FROM properties p
          `;
        } else {
          sql = "SELECT " + sanitizeSelectList(selectStr || "*") + " FROM " + table;
        }
      } else if (type === "insert") {
        const isArray = Array.isArray(payload);
        const rows = isArray ? payload : [payload];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        sql = "INSERT INTO " + table + " (" + keys.join(", ") + ") VALUES ";
        const values = [];
        for (const row of rows) {
          const rowVals = [];
          for (const key of keys) {
            rowVals.push("$" + paramIdx++);
            params.push(toPgParam(table, key, row[key]));
          }
          values.push("(" + rowVals.join(", ") + ")");
        }
        sql += values.join(", ");
        if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      } else if (type === "upsert") {
        const isArray = Array.isArray(payload);
        const rows = isArray ? payload : [payload];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        sql = "INSERT INTO " + table + " (" + keys.join(", ") + ") VALUES ";
        const values = [];
        for (const row of rows) {
          const rowVals = [];
          for (const key of keys) {
            rowVals.push("$" + paramIdx++);
            params.push(toPgParam(table, key, row[key]));
          }
          values.push("(" + rowVals.join(", ") + ")");
        }
        sql += values.join(", ");
        if (onConflict) {
          const conflictCols = onConflict
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (conflictCols.length > 0) {
            sql +=
              " ON CONFLICT (" +
              conflictCols.join(", ") +
              ") DO UPDATE SET " +
              keys.map((k) => k + " = EXCLUDED." + k).join(", ");
          }
        }
        if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      } else if (type === "update") {
        const keys = Object.keys(payload);
        sql = "UPDATE " + table + " SET ";
        const sets = [];
        for (const key of keys) {
          sets.push(key + " = $" + paramIdx++);
          params.push(toPgParam(table, key, payload[key]));
        }
        sql += sets.join(", ");
      } else if (type === "delete") {
        sql = "DELETE FROM " + table;
      }

      // Add WHERE clauses for select, update, delete
      if (
        (type === "select" || type === "update" || type === "delete") &&
        filters &&
        filters.length > 0
      ) {
        sql += " WHERE ";
        const conditions = [];
        for (const f of filters) {
          if (f.op === "eq") {
            conditions.push(f.column + " = $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === "in") {
            const inPlaceholders = f.value.map(() => "$" + paramIdx++).join(", ");
            conditions.push(f.column + " IN (" + inPlaceholders + ")");
            params.push(...f.value);
          } else if (f.op === "gt") {
            conditions.push(f.column + " > $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === "gte") {
            conditions.push(f.column + " >= $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === "lt") {
            conditions.push(f.column + " < $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === "lte") {
            conditions.push(f.column + " <= $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === "ilike") {
            conditions.push(f.column + " ILIKE $" + paramIdx++);
            params.push(f.value);
          }
        }
        sql += conditions.join(" AND ");
      }

      if (type === "update" || type === "delete") {
        if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      }

      if (type === "select") {
        if (order && order.length > 0) {
          sql += " ORDER BY ";
          const orderings = order.map(
            (o) => o.column + " " + (o.ascending === false ? "DESC" : "ASC"),
          );
          sql += orderings.join(", ");
        }
        if (limit) {
          sql += " LIMIT $" + paramIdx++;
          params.push(limit);
        }
      }

      const res = await dbQuery(sql, params);

      let returnData = res.rows;
      if (single) {
        if (returnData.length === 0) return { data: null, error: { message: "Row not found" } };
        returnData = stripSensitive([returnData[0]], isOperatorUser)[0];
      } else if (maybeSingle) {
        returnData =
          returnData.length > 0 ? stripSensitive([returnData[0]], isOperatorUser)[0] : null;
      } else {
        returnData = stripSensitive(returnData, isOperatorUser);
      }

      return { data: returnData, error: null };
    } catch (error) {
      const err = error as { message?: string; code?: string };
      console.error(
        "[executeDbQueryFn] failed:",
        err?.message,
        "| op:",
        data?.type,
        "| table:",
        data?.table,
        "| code:",
        err?.code ?? "n/a",
      );
      return {
        data: null,
        error: { message: err.message || "Database operation failed. Please try again." },
      };
    }
  });
