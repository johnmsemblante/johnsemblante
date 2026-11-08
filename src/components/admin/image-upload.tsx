"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useAdmin } from "./admin-gate";

export function ImageUpload({ onUpload, onBusy, label = "Upload an image", successMessage = "Image uploaded. Save your changes to use it.", disabled = false }: {
  onUpload: (url: string) => void;
  onBusy: (value: boolean) => void;
  label?: string;
  successMessage?: string;
  disabled?: boolean;
}) {
  const { user } = useAdmin();
  const id = useId();
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "uploaded">("idle");
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const endpoint = process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);
  if (!endpoint) return <p className="form-note">Image uploads are not connected. You can use an existing local path or public image URL.</p>;

  return <div className="admin-image-upload" aria-busy={status === "uploading"}>
    <label htmlFor={id}>{label}</label>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={disabled || status === "uploading"} aria-describedby={`${id}-help ${id}-status`} onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = "";
      if (!file || request.current || disabled) return;
      setError(""); setStatus("idle");
      if (file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) { setError("Choose a JPG, PNG, WebP or AVIF image up to 5 MB."); return; }
      const controller = new AbortController(); request.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      onBusy(true); setStatus("uploading");
      try {
        const token = await user.getIdToken();
        if (controller.signal.aborted) throw new Error("upload-aborted");
        const body = new FormData(); body.set("file", file);
        const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body, signal: controller.signal, credentials: "omit", redirect: "error" });
        const result = await response.json();
        if (!response.ok) throw new Error(typeof result?.message === "string" ? result.message : "The image upload failed. Please try again.");
        const url = typeof result?.url === "string" ? new URL(result.url) : null;
        if (!url || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.username || url.password || !/^\/[^/]+\/image\/upload\//.test(url.pathname)) throw new Error("The upload service returned an invalid image URL. Please try again.");
        if (mounted.current && !controller.signal.aborted) { onUpload(url.href); setStatus("uploaded"); }
      } catch (cause) {
        if (mounted.current) {
          setError(controller.signal.aborted ? "The upload timed out. Your fields are preserved; try again." : cause instanceof Error ? cause.message : "The image upload failed. Your fields are preserved; try again.");
          setStatus("idle");
        }
      } finally {
        window.clearTimeout(timeout); request.current = null;
        if (mounted.current) onBusy(false);
      }
    }} />
    <p id={`${id}-help`} className="form-note">JPG, PNG, WebP or AVIF, up to 5 MB. Images are hosted on Cloudinary.</p>
    <p id={`${id}-status`} role="status" aria-live="polite" className="form-note">{status === "uploading" ? "Uploading image… Please keep this editor open." : status === "uploaded" ? successMessage : ""}</p>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
