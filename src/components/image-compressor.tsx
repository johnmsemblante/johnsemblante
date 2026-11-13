"use client";

import { useEffect, useRef, useState } from "react";
import { downloadName, formatBytes, inspectImage, targetBytes, type CompressionResult, type CompressionSettings, type ImageFormat, type ImageInfo } from "@/lib/image-compression";

type Selected = { file: File; url: string; info: ImageInfo };
const formatLabel = (format: string) => format === "image/jpeg" ? "JPG" : format.split("/")[1].toUpperCase();

export function ImageCompressor() {
  const [selected, setSelected] = useState<Selected | null>(null);
  const [mode, setMode] = useState<"target" | "quality">("target"), [preset, setPreset] = useState("200");
  const [custom, setCustom] = useState("200"), [unit, setUnit] = useState("KB");
  const [format, setFormat] = useState<ImageFormat>("image/jpeg"), [quality, setQuality] = useState(80);
  const [result, setResult] = useState<(CompressionResult & { url: string }) | null>(null);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState("Choose an image to get started."), [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const generation = useRef(0), worker = useRef<Worker | null>(null), controller = useRef<AbortController | null>(null);
  const originalUrl = useRef(""), resultUrl = useRef("");
  const input = useRef<HTMLInputElement>(null);
  function invalidate() {
    generation.current++; worker.current?.terminate(); worker.current = null; controller.current?.abort();
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = ""; setResult(null); setBusy(false); setError(""); setStatus("Ready to compress.");
  }
  useEffect(() => () => {
    generation.current++; worker.current?.terminate(); controller.current?.abort();
    if (originalUrl.current) URL.revokeObjectURL(originalUrl.current);
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
  }, []);
  async function select(files: FileList | File[]) {
    invalidate(); setSelected(null);
    if (originalUrl.current) URL.revokeObjectURL(originalUrl.current);
    originalUrl.current = "";
    if (files.length !== 1) { setError("Choose one image at a time."); return; }
    const file = files[0], token = generation.current;
    setBusy(true); setStatus("Checking your image locally…");
    let url = "";
    try {
      const info = await inspectImage(file);
      if (token !== generation.current) return;
      url = URL.createObjectURL(file);
      const image = new Image(); image.src = url;
      await image.decode();
      if (token !== generation.current) { URL.revokeObjectURL(url); return; }
      info.width = image.naturalWidth; info.height = image.naturalHeight;
      originalUrl.current = url; setSelected({ file, url, info }); setFormat(info.format); setStatus("Ready to compress.");
    } catch (cause) {
      if (url) URL.revokeObjectURL(url);
      if (token === generation.current) setError(cause instanceof Error && !url ? cause.message : "Could not decode this image. Try another file or a smaller image.");
    } finally { if (token === generation.current) setBusy(false); }
  }
  let target = 200_000, targetError = "";
  try { target = targetBytes(preset === "custom" ? custom : preset, preset === "custom" ? unit : "KB"); }
  catch (cause) { targetError = (cause as Error).message; }
  async function compress() {
    if (!selected || busy || (mode === "target" && targetError)) return;
    invalidate(); const token = generation.current;
    const settings: CompressionSettings = { mode, target: mode === "target" ? target : 200_000, quality: quality / 100, format };
    setBusy(true); setStatus("Processing your image locally…");
    const abort = new AbortController(); controller.current = abort;
    try {
      let output: CompressionResult;
      if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function") {
        output = await new Promise<CompressionResult>((resolve, reject) => {
          const instance = new Worker(new URL("../lib/image-compression.worker.ts", import.meta.url)); worker.current = instance;
          const timer = window.setTimeout(() => { instance.terminate(); reject(Error("Processing took too long. Try a smaller image or a larger target.")); }, 30000);
          abort.signal.addEventListener("abort", () => { clearTimeout(timer); instance.terminate(); reject(Error("Processing cancelled.")); }, { once: true });
          instance.onmessage = event => {
            if (token !== generation.current) return;
            if (event.data.progress) { setStatus(event.data.progress); return; }
            clearTimeout(timer); instance.terminate(); worker.current = null;
            if (event.data.error) reject(Error(event.data.error)); else resolve(event.data.result);
          };
          instance.onerror = () => { clearTimeout(timer); instance.terminate(); reject(Error("The image worker could not start. Try a different browser or a smaller image.")); };
          instance.postMessage({ file: selected.file, settings });
        });
      } else {
        const { compressImage } = await import("@/lib/image-compression");
        output = await compressImage(selected.file, settings, message => { if (token === generation.current) setStatus(message); }, abort.signal);
      }
      if (token !== generation.current) return;
      const url = URL.createObjectURL(output.blob); resultUrl.current = url; setResult({ ...output, url });
      setStatus(output.unchanged ? "Your original is already within the target. No extra compression was necessary; download keeps the original image." : mode === "target" ? output.blob.size <= target ? "Target achieved. The actual file size is within your selected limit." : "Target not achieved within practical limits. You can download the smallest result, choose a larger target, or explicitly select another format." : "Compression completed. Review the actual size and preview before downloading.");
    } catch (cause) { if (token === generation.current) setError(cause instanceof Error ? cause.message : "Compression failed. Try a smaller image."); }
    finally { if (token === generation.current) setBusy(false); }
  }
  function remove() {
    invalidate(); setSelected(null); if (originalUrl.current) URL.revokeObjectURL(originalUrl.current); originalUrl.current = "";
    if (input.current) input.current.value = "";
    setStatus("Choose an image to get started.");
  }
  return <div className="ic-tool" aria-busy={busy}>
    <div className="ic-layout">
      <section className="ic-panel" aria-labelledby="ic-settings">
        <p className="eyebrow">Private by design / by John Semblante</p><h2 id="ic-settings">Smaller files. Simple controls.</h2>
        <div className={`ic-drop${dragging ? " ic-dragging" : ""}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void select(event.dataTransfer.files); }}>
          <label htmlFor="ic-file">{selected ? "Replace your image" : "Choose an image or drop it here"}</label>
          <input ref={input} id="ic-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { if (event.target.files?.length) void select(event.target.files); event.target.value = ""; }} aria-describedby="ic-limits" />
          <p id="ic-limits">Still JPG, PNG or WebP · one image · up to 20 MB, 24 megapixels and 12,000 pixels per side.</p>
        </div>
        {selected && <div className="ic-source"><strong>{selected.file.name}</strong><p>{formatBytes(selected.file.size)} · {selected.info.width} × {selected.info.height} px · {formatLabel(selected.info.format)}</p><button type="button" className="text-link" onClick={remove}>Remove image</button></div>}
        <label className="ic-field">Compression mode<select value={mode} onChange={event => { invalidate(); setMode(event.target.value as typeof mode); }}><option value="target">Compress to Target Size</option><option value="quality">Adjust Image Quality</option></select></label>
        {mode === "target" ? <fieldset><legend>Choose a maximum file size</legend><div className="ic-presets">{["50", "100", "200", "500", "custom"].map(value => <button type="button" key={value} aria-pressed={preset === value} onClick={() => { invalidate(); setPreset(value); }}>{value === "custom" ? "Custom" : `${value} KB`}</button>)}</div>
          {preset === "custom" && <div className="ic-custom"><label className="ic-field">Target size<input type="number" min={unit === "MB" ? .001 : 1} max={unit === "MB" ? 20 : 20000} step="any" value={custom} aria-invalid={!!targetError} aria-describedby="ic-target-help" onChange={event => { invalidate(); setCustom(event.target.value); }} /></label><label className="ic-field">Unit<select value={unit} onChange={event => { invalidate(); setUnit(event.target.value); }}><option>KB</option><option>MB</option></select></label></div>}
          <p id="ic-target-help">{targetError || "1 KB = 1,000 bytes. Quality and dimensions may decrease to approach your target."}</p>
        </fieldset> : <label className="ic-field">Image quality: {quality}%<input type="range" min="10" max="100" value={quality} disabled={format === "image/png"} onChange={event => { invalidate(); setQuality(Number(event.target.value)); }} />{format === "image/png" && <span>PNG is lossless; its quality cannot be adjusted. Choose JPG or WebP, or use target-size mode to reduce dimensions.</span>}</label>}
        <label className="ic-field">Output format<select value={format} onChange={event => { invalidate(); setFormat(event.target.value as ImageFormat); }}><option value="image/jpeg">JPG — white background, no transparency</option><option value="image/png">PNG — preserve transparency</option><option value="image/webp">WebP — preserve transparency</option></select></label>
        {format === "image/jpeg" && selected?.info.format !== "image/jpeg" && <p className="ic-notice">Selecting JPG removes transparency and replaces it with white. Choose PNG or WebP to keep a transparent background.</p>}
        <p className="ic-hint">Re-encoded images use at most 4,096 pixels on the longest side. Very small targets can lose detail. Animation is not supported.</p>
        <div className="actions"><button className="button" type="button" disabled={!selected || busy || (mode === "target" && !!targetError) || (mode === "quality" && format === "image/png")} onClick={() => void compress()}>{busy ? "Processing…" : "Compress Image"}</button>{busy && <button type="button" className="text-link" onClick={invalidate}>Cancel</button>}</div>
      </section>
      <section className="ic-panel" aria-labelledby="ic-preview-title">
        <h2 id="ic-preview-title">Preview &amp; download</h2><p className="ic-status" role="status" aria-live="polite">{status}</p>{error && <p className="ic-error" role="alert">{error}</p>}
        <div className="ic-previews"><figure><div className="ic-preview">{selected ? <img src={selected.url} alt="Original selected image" /> : <p>Your original image appears here.</p>}</div><figcaption>Original{selected && <span>{formatBytes(selected.file.size)} · {selected.info.width} × {selected.info.height} px · {formatLabel(selected.info.format)}</span>}</figcaption></figure>
          <figure><div className="ic-preview">{result ? <img src={result.url} alt="Compressed image ready to download" /> : <p>Your compressed result appears here.</p>}</div><figcaption>Result{result && <span>{formatBytes(result.blob.size)} · {result.width} × {result.height} px · {formatLabel(result.format)}</span>}</figcaption></figure></div>
        {result && selected && <div className="ic-summary"><p>{result.blob.size < selected.file.size ? `${((1 - result.blob.size / selected.file.size) * 100).toFixed(1)}% smaller` : result.blob.size === selected.file.size ? "Original file size preserved" : `No size reduction achieved (${((result.blob.size / selected.file.size - 1) * 100).toFixed(1)}% larger)`}</p><p>{result.blob.size.toLocaleString()} bytes{mode === "target" && ` / ${target.toLocaleString()} byte target`}</p><a className="button" href={result.url} download={downloadName(selected.file.name, result.format)}>Download Compressed Image</a><p className="ic-hint">The download uses the exact file shown above. On mobile, your browser may open a save or share sheet.</p></div>}
        <p className="ic-privacy">Your images are compressed directly in your browser. They are not uploaded to our servers.</p>
      </section>
    </div>
  </div>;
}
