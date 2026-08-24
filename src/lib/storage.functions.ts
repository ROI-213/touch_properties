import { createServerFn } from "@tanstack/react-start";
import { query } from "@/server/db";
import { getRequestAuth, isOperator } from "@/lib/server-auth";

const MAX_ANON_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB for public form photos
const ANON_ALLOWED_BUCKETS = new Set(["property-media"]);
const ANON_ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

export const storageUploadFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { bucket: string; path: string; base64: string; mimetype: string })
  .handler(async ({ data }) => {
    try {
      if (!PATH_RE.test(data.bucket) || !PATH_RE.test(data.path)) {
        return { data: null, error: { message: "Invalid storage path." } };
      }

      // Public visitors may only attach photos to their enquiry submissions.
      // Operators (admin/active staff) may manage all media buckets.
      let isOperatorUser = false;
      {
        const { userId } = getRequestAuth();
        isOperatorUser = userId ? await isOperator(userId) : false;
      }
      if (!isOperatorUser) {
        if (!ANON_ALLOWED_BUCKETS.has(data.bucket)) {
          return { data: null, error: { message: "Forbidden: upload not allowed." } };
        }
        if (!ANON_ALLOWED_MIMES.has(data.mimetype)) {
          return { data: null, error: { message: "Only image uploads are allowed." } };
        }
        const approxBytes = Math.floor((data.base64?.length ?? 0) * 0.75);
        if (!approxBytes || approxBytes > MAX_ANON_UPLOAD_BYTES) {
          return { data: null, error: { message: "Image is too large. Maximum size is 5 MB." } };
        }
      }

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
      console.error(
        "[storageUploadFn] failed:",
        err?.message,
        "| bucket:", data?.bucket,
        "| code:", err?.code ?? "n/a"
      );
      return { data: null, error: { message: err.message || "Upload failed. Please try again." } };
    }
  });

export const storageRemoveFn = createServerFn({ method: "POST" })
  .validator((d: any) => d as { bucket: string; path: string })
  .handler(async ({ data }) => {
    try {
      // Deleting stored media must never be possible anonymously.
      const { userId } = getRequestAuth();
      const operatorOk = userId ? await isOperator(userId) : false;
      if (!operatorOk) {
        return { data: null, error: { message: "Forbidden: sign in required to delete files." } };
      }

      if (!PATH_RE.test(data.bucket) || !PATH_RE.test(data.path)) {
        return { data: null, error: { message: "Invalid storage path." } };
      }

      await query("DELETE FROM public.custom_storage WHERE bucket = $1 AND path = $2", [data.bucket, data.path]);
      return { data: true, error: null };
    } catch (err: any) {
      console.error("[storageRemoveFn] failed:", err?.message, "| bucket:", data?.bucket);
      return { data: null, error: { message: err.message || "Could not delete file." } };
    }
  });
