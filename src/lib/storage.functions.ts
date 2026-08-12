import { createServerFn } from "@tanstack/react-start";
import { query } from "@/server/db";

export const storageUploadFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { bucket: string; path: string; base64: string; mimetype: string })
  .handler(async ({ data }) => {
    try {
      // Decode base64 to Buffer
      const buffer = Buffer.from(data.base64, 'base64');
      
      // Upsert into custom_storage
      await query(
        `INSERT INTO public.custom_storage (bucket, path, data, mimetype) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (bucket, path) DO UPDATE SET data = $3, mimetype = $4`,
        [data.bucket, data.path, buffer, data.mimetype]
      );

      return { data: { path: data.path }, error: null };
    } catch (err: any) {
      console.error("Storage upload error:", err);
      return { data: null, error: { message: err.message } };
    }
  });

export const storageRemoveFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { bucket: string; path: string })
  .handler(async ({ data }) => {
    try {
      await query("DELETE FROM public.custom_storage WHERE bucket = $1 AND path = $2", [data.bucket, data.path]);
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  });
