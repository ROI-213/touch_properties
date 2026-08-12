import { createServerFn } from "@tanstack/react-start";
import { query as dbQuery } from "@/server/db";

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

  const parts = selectStr.split(",").map((s) => s.trim()).filter(Boolean);
  const kept = parts.filter((p) => !p.includes(":"));
  return kept.length > 0 ? kept.join(", ") : "*";
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
  "objects.path_tokens",
]);

function toPgParam(table: string, column: string, value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === "object") {
    if (PG_ARRAY_COLUMNS.has(table + "." + column)) return value;
    return JSON.stringify(value);
  }
  return value;
}

export const executeDbQueryFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as {
    table: string;
    type: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
    selectStr?: string;
    filters?: any[];
    order?: any[];
    limit?: number;
    single?: boolean;
    maybeSingle?: boolean;
    payload?: any;
    onConflict?: string;
    returning?: boolean;
  })
  .handler(async ({ data }) => {
    try {
      const { table, type, selectStr, filters, order, limit, single, maybeSingle, payload, onConflict, returning } = data;
      
      let sql = "";
      const params: any[] = [];
      let paramIdx = 1;

      if (type === 'select') {
        if (table === 'properties' && selectStr && selectStr.includes('locations')) {
          sql = `
            SELECT p.*,
                   (SELECT row_to_json(b) FROM (SELECT name FROM builders WHERE id = p.builder_id) b) as builder,
                   (SELECT row_to_json(l) FROM (SELECT zone, locality FROM locations WHERE id = p.location_id) l) as location,
                   (SELECT coalesce(json_agg(row_to_json(img)), '[]') FROM (SELECT url, image_type FROM property_images WHERE property_id = p.id) img) as property_images
            FROM properties p
          `;
        } else {
          sql = "SELECT " + (selectStr || '*') + " FROM " + table;
        }
      } else if (type === 'insert') {
        const isArray = Array.isArray(payload);
        const rows = isArray ? payload : [payload];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        sql = "INSERT INTO " + table + " (" + keys.join(', ') + ") VALUES ";
        const values = [];
        for (const row of rows) {
          const rowVals = [];
          for (const key of keys) {
            rowVals.push("$" + paramIdx++);
            params.push(toPgParam(table, key, row[key]));
          }
          values.push("(" + rowVals.join(', ') + ")");
        }
        sql += values.join(', ');
        if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      } else if (type === 'upsert') {
        const isArray = Array.isArray(payload);
        const rows = isArray ? payload : [payload];
        if (rows.length === 0) return { data: [], error: null };
        const keys = Object.keys(rows[0]);
        sql = "INSERT INTO " + table + " (" + keys.join(', ') + ") VALUES ";
        const values = [];
        for (const row of rows) {
          const rowVals = [];
          for (const key of keys) {
            rowVals.push("$" + paramIdx++);
            params.push(toPgParam(table, key, row[key]));
          }
          values.push("(" + rowVals.join(', ') + ")");
        }
        sql += values.join(', ');
        if (onConflict) {
          const conflictCols = onConflict.split(',').map((s) => s.trim()).filter(Boolean);
          if (conflictCols.length > 0) {
            sql += " ON CONFLICT (" + conflictCols.join(', ') + ") DO UPDATE SET " +
              keys.map((k) => k + " = EXCLUDED." + k).join(', ');
          }
        }
        if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      } else if (type === 'update') {
        const keys = Object.keys(payload);
        sql = "UPDATE " + table + " SET ";
        const sets = [];
        for (const key of keys) {
          sets.push(key + " = $" + paramIdx++);
          params.push(toPgParam(table, key, payload[key]));
        }
        sql += sets.join(', ');
      } else if (type === 'delete') {
        sql = "DELETE FROM " + table;
      }

      // Add WHERE clauses for select, update, delete
      if ((type === 'select' || type === 'update' || type === 'delete') && filters && filters.length > 0) {
        sql += " WHERE ";
        const conditions = [];
        for (const f of filters) {
          if (f.op === 'eq') {
            conditions.push(f.column + " = $" + paramIdx++);
            params.push(f.value);
          } else if (f.op === 'in') {
             const inPlaceholders = f.value.map(() => "$" + paramIdx++).join(', ');
             conditions.push(f.column + " IN (" + inPlaceholders + ")");
             params.push(...f.value);
          } else if (f.op === 'gt') {
             conditions.push(f.column + " > $" + paramIdx++);
             params.push(f.value);
          } else if (f.op === 'gte') {
             conditions.push(f.column + " >= $" + paramIdx++);
             params.push(f.value);
          } else if (f.op === 'lt') {
             conditions.push(f.column + " < $" + paramIdx++);
             params.push(f.value);
          } else if (f.op === 'lte') {
             conditions.push(f.column + " <= $" + paramIdx++);
             params.push(f.value);
          } else if (f.op === 'ilike') {
             conditions.push(f.column + " ILIKE $" + paramIdx++);
             params.push(f.value);
          }
        }
        sql += conditions.join(' AND ');
      }

      if (type === 'update' || type === 'delete') {
         if (returning || selectStr) sql += " RETURNING " + returningColumns(table, selectStr);
      }

      if (type === 'select') {
        if (order && order.length > 0) {
          sql += " ORDER BY ";
          const orderings = order.map(o => o.column + " " + (o.ascending === false ? 'DESC' : 'ASC'));
          sql += orderings.join(', ');
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
        returnData = returnData[0];
      } else if (maybeSingle) {
        returnData = returnData.length > 0 ? returnData[0] : null;
      }

      return { data: returnData, error: null };
    } catch (error: any) {
      console.error("DB Query Error:", error, "SQL:", data.type, data.table, "PARAMS:", data.filters);
      return { data: null, error: { message: error.message || "Database error" } };
    }
  });
