import { executeDbQueryFn } from "@/lib/db.functions";

class QueryBuilder {
  private _table: string;
  private _type: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private _selectStr = '*';
  private _filters: any[] = [];
  private _order: any[] = [];
  private _limit?: number;
  private _single = false;
  private _maybeSingle = false;
  private _payload: any;
  private _returning = false;
  private _onConflict?: string;

  constructor(table: string) {
    this._table = table;
  }

  select(columns: string = '*') {
    this._selectStr = columns;
    return this;
  }

  insert(payload: any) {
    this._type = 'insert';
    this._payload = payload;
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this._type = 'upsert';
    this._payload = payload;
    this._onConflict = options?.onConflict;
    return this;
  }

  update(payload: any) {
    this._type = 'update';
    this._payload = payload;
    return this;
  }

  delete() {
    this._type = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push({ op: 'eq', column, value });
    return this;
  }

  in(column: string, value: any[]) {
    this._filters.push({ op: 'in', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push({ op: 'gt', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push({ op: 'lt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this._filters.push({ op: 'gte', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push({ op: 'lte', column, value });
    return this;
  }

  ilike(column: string, value: any) {
    this._filters.push({ op: 'ilike', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      const authToken =
        typeof window !== "undefined" ? localStorage.getItem("ts-auth-token") : null;
      const result = await executeDbQueryFn({
        data: {
          table: this._table,
          type: this._type,
          selectStr: this._selectStr,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
          single: this._single,
          maybeSingle: this._maybeSingle,
          payload: this._payload,
          onConflict: this._onConflict,
          returning:
            this._returning ||
            this._type === "insert" ||
            this._type === "update" ||
            this._type === "upsert",
          authToken,
        },
      });
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
    }
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  channel(name: string) {
    return {
      on: () => this.channel(name),
      subscribe: (cb?: any) => {
        if (cb) cb('SUBSCRIBED');
        return this.channel(name);
      },
      unsubscribe: async () => {}
    };
  },
  removeChannel: async () => {},
  async rpc(func: string, params: any) {
    if (func === 'has_role') {
      const { executeDbQueryFn } = await import("@/lib/db.functions");
      const { data, error } = await executeDbQueryFn({
        data: {
          table: "user_roles",
          type: "select",
          filters: [
            { op: "eq", column: "user_id", value: params._user_id },
            { op: "eq", column: "role", value: params._role }
          ]
        }
      });
      return { data: !!(data && data.length > 0), error };
    }
    return { data: null, error: { message: "RPC not implemented in mock" } };
  },
  auth: {
    admin: {
      createUser: async (params: any) => {
        return { data: { user: { id: "mock-id", email: params.email } }, error: null };
      },
      deleteUser: async (_id: string) => {
        return { data: true, error: null };
      },
      updateUserById: async (id: string, _params: any) => {
        return { data: { user: { id } }, error: null };
      }
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ts-auth-token');
        localStorage.removeItem('ts-auth-user');
      }
    },
    getSession: async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('ts-auth-token');
        if (token) return { data: { session: { access_token: token } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    getUser: async () => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('ts-auth-user');
        if (userStr) return { data: { user: JSON.parse(userStr) }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    signInWithPassword: async () => ({ data: {}, error: null }),
    signUp: async () => ({ data: {}, error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    signInWithOAuth: async () => ({ error: { message: "OAuth not supported in custom backend" } }),
    resend: async () => ({ error: null }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        try {
          let base64 = "";
          let mimetype = "application/octet-stream";
          
          if (file instanceof File || file instanceof Blob) {
            mimetype = file.type;
            const buffer = await file.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            base64 = btoa(binary);
          } else {
            // Unhandled upload type for mock
            console.warn("Unhandled file upload type", file);
            return { error: { message: "Unsupported mock upload type" } };
          }
          
          const { storageUploadFn } = await import("@/lib/storage.functions");
          const { data, error } = await storageUploadFn({
            data: { bucket, path, base64, mimetype }
          });
          return { data, error };
        } catch (e: any) {
          return { data: null, error: { message: e.message } };
        }
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `/api/storage/${bucket}/${path}` } };
      },
      createSignedUrl: async (path: string) => {
        return { data: { signedUrl: `/api/storage/${bucket}/${path}`, path }, error: null };
      },
      createSignedUrls: async (paths: string[]) => {
        return {
          data: {
            signedUrls: paths.map((path: string) => ({
              path,
              signedUrl: `/api/storage/${bucket}/${path}`,
            })),
          },
          error: null,
        };
      },
      remove: async (paths: string[]) => {
        const { storageRemoveFn } = await import("@/lib/storage.functions");
        for (const path of paths) {
          await storageRemoveFn({ data: { bucket, path } });
        }
        return { data: true, error: null };
      }
    })
  }
} as any;

