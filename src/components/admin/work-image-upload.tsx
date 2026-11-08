"use client";
import { useRef, useState } from "react";
import { useAdmin } from "./admin-gate";

export function WorkImageUpload({ onUpload, onBusy }: { onUpload: (url: string) => void; onBusy: (value: boolean) => void }) {
  const { user } = useAdmin();
  const [error, setError] = useState("");
  const pending = useRef(false);
  const endpoint = process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL;
  if (!endpoint) return <p className="form-note">Image uploads are not connected. You can use an existing local path or public image URL.</p>;
  return <div><label>Upload an image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={async event => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || pending.current) return;
    if (file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { setError("Choose a JPG, PNG, WebP or AVIF image up to 5 MB."); return; }
    pending.current = true; onBusy(true); setError("");
    try {
      const token = await user.getIdToken(); const body = new FormData(); body.set("file", file);
      const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, signal: AbortSignal.timeout(60000) });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string" || !result.url.startsWith("https://res.cloudinary.com/")) throw new Error(result.message || "The image upload failed. Your project fields are preserved; try again.");
      onUpload(result.url);
    } catch (cause) { setError((cause as Error).message); }
    finally { pending.current = false; onBusy(false); }
  }} /></label>{error && <p role="alert" className="form-error">{error}</p>}</div>;
}
