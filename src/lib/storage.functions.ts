import { createServerFn } from "@tanstack/react-start";
import { query } from "@/server/db";
import { getRequestAuth, isOperator } from "@/lib/server-auth";

const MAX_ANON_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB for public form photos
const ANON_ALLOWED_BUCKETS = new Set(["property-media"]);
const ANON_ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
// Anonymous uploads live exclusively under the sell-submissions folder and
// cannot contain slashes beyond it (prevents overwriting other assets).
const ANON_PATH_RE = /^sell-submissions\/[a-zA-Z0-9._-]+$/;
// Operator-managed paths stay flat-ish and traversal-proof.
const PATH_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/;

/** Verify the first bytes actually look like the declared image type. */
function looksLikeImage(mimetype: string, buf: Buffer): boolean {
  if (buf.length < 12) return false;
  switch (mimetype) {
    case "image/jpeg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    case "image/gif":
      return (
        buf.slice(0, 6).toString("ascii") === "GIF87a" ||
        buf.slice(0, 6).toString("ascii") === "GIF89a"
      );
    case "image/webp":
      return (
        buf.slice(0, 4).toString("ascii") === "RIFF" &&
        buf.slice(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export const storageUploadFn = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) => d as { bucket: string; path: string; base64: string; mimetype: string },
  )
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
        if (!ANON_PATH_RE.test(data.path)) {
          return { data: null, error: { message: "Invalid storage path." } };
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
      const buffer = Buffer.from(data.base64, "base64");

      if (!isOperatorUser && !looksLikeImage(data.mimetype, buffer)) {
        return { data: null, error: { message: "File content does not look like a valid image." } };
      }

      // Upsert into custom_storage
      await query(
        `INSERT INTO public.custom_storage (bucket, path, data, mimetype)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (bucket, path) DO UPDATE SET data = $3, mimetype = $4`,
        [data.bucket, data.path, buffer, data.mimetype],
      );

      return { data: { path: data.path }, error: null };
    } catch (err) {
      const e = err as { message?: string; code?: string };
      console.error(
        "[storageUploadFn] failed:",
        e?.message,
        "| bucket:",
        data?.bucket,
        "| code:",
        e?.code ?? "n/a",
      );
      return { data: null, error: { message: e.message || "Upload failed. Please try again." } };
    }
  });

export const storageRemoveFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { bucket: string; path: string })
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

      await query("DELETE FROM public.custom_storage WHERE bucket = $1 AND path = $2", [
        data.bucket,
        data.path,
      ]);
      return { data: true, error: null };
    } catch (err) {
      const e = err as { message?: string };
      console.error("[storageRemoveFn] failed:", e?.message, "| bucket:", data?.bucket);
      return { data: null, error: { message: e.message || "Could not delete file." } };
    }
  });
