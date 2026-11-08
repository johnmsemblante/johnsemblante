type Env = {
  FIREBASE_PROJECT_ID: string; CLOUDINARY_CLOUD_NAME: string; CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string; CLOUDINARY_UPLOAD_PRESET: string; ALLOWED_ORIGINS: string;
};
const imageLimit = 5 * 1024 * 1024;
const formats = ["jpg", "jpeg", "png", "webp", "avif"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") ?? "";
    const headers = {
      "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store", Vary: "Origin", "Content-Type": "application/json",
    };
    const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers });
    if (!env.ALLOWED_ORIGINS.split(",").includes(origin)) return new Response("Forbidden", { status: 403 });
    if (new URL(request.url).pathname !== "/upload") return reply(404, "Not found");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, "Use POST to upload an image.");
    if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) return reply(503, "Media uploads are not configured.");
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ") || auth.length > 12000) return reply(401, "Sign in required.");
    try {
      // Firestore validates the token signature and expiry; decoded claims alone grant no access.
      const claims = JSON.parse(atob(auth.slice(7).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (claims.aud !== env.FIREBASE_PROJECT_ID || claims.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}` || claims.email_verified !== true || typeof claims.sub !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(claims.sub)) return reply(403, "Admin access required.");
      const member = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/admins/${claims.sub}`, { headers: { Authorization: auth }, redirect: "error", signal: AbortSignal.timeout(10000) });
      if (!member.ok) return reply(403, "Admin access required.");
      const record = await member.json() as { fields?: { enabled?: { booleanValue?: boolean } } };
      if (record.fields?.enabled?.booleanValue !== true) return reply(403, "Admin access required.");
    } catch { return reply(403, "Upload authorization failed. Sign in again and retry."); }
    if (!request.headers.get("Content-Type")?.startsWith("multipart/form-data;")) return reply(415, "Choose an image file.");
    // Bound the body while reading, even if Content-Length is omitted or inaccurate.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, "Choose an image file.");
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > imageLimit + 65536) { await reader.cancel(); return reply(413, "Choose an image up to 5 MB."); }
        chunks.push(value);
      }
      const body = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("Content-Type")! }, body }).formData();
      const file = form.get("file");
      if (!file || typeof file === "string" || file.size === 0 || file.size > imageLimit || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) return reply(400, "Choose a JPG, PNG, WebP or AVIF image up to 5 MB.");
      const parameters = {
        allowed_formats: formats.join(","), folder: "portfolio/works", overwrite: "false", public_id: crypto.randomUUID(),
        timestamp: Math.floor(Date.now() / 1000), upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
      };
      const message = Object.entries(parameters).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&") + env.CLOUDINARY_API_SECRET;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
      const signature = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, "0")).join("");
      const upload = new FormData(); upload.set("file", file);
      for (const [key, value] of Object.entries(parameters)) upload.set(key, String(value));
      upload.set("api_key", env.CLOUDINARY_API_KEY); upload.set("signature", signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`, { method: "POST", body: upload, redirect: "error", signal: AbortSignal.timeout(45000) });
      const result = await response.json() as { secure_url?: string; resource_type?: string; format?: string };
      const prefix = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;
      if (!response.ok || result.resource_type !== "image" || !formats.includes(result.format ?? "") || !result.secure_url?.startsWith(prefix)) return reply(502, "Cloudinary rejected the image. Check the signed preset and API key pair, then retry.");
      return new Response(JSON.stringify({ url: result.secure_url }), { headers });
    } catch { return reply(502, "Image upload failed. Your project fields are preserved; please retry."); }
  },
};
