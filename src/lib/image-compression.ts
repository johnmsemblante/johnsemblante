export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";
export type CompressionSettings = { mode: "target" | "quality"; target: number; quality: number; format: ImageFormat };
export type ImageInfo = { width: number; height: number; format: ImageFormat };
export type CompressionResult = ImageInfo & { blob: Blob; original: ImageInfo; unchanged: boolean };
export const MAX_FILE_BYTES = 20_000_000;
export function formatBytes(bytes: number) { return bytes < 1_000_000 ? `${(bytes / 1000).toFixed(2)} KB` : `${(bytes / 1_000_000).toFixed(2)} MB`; }
export function targetBytes(value: string, unit: string) {
  const bytes = Number(value) * (unit === "MB" ? 1_000_000 : 1000);
  if (!value.trim() || !Number.isFinite(bytes) || bytes < 1000 || bytes > MAX_FILE_BYTES) throw Error("Choose a target from 1 KB to 20 MB.");
  return Math.floor(bytes);
}
export function downloadName(name: string, format: ImageFormat) {
  return `${name.replace(/\.[^.]*$/, "").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 160) || "image"}-compressed.${format === "image/jpeg" ? "jpg" : format.split("/")[1]}`;
}
function dimensions(width: number, height: number) {
  if (!width || !height || width > 12000 || height > 12000 || width * height > 24_000_000) throw Error("Choose an image up to 24 megapixels and 12,000 pixels per side. Resize it on your device first.");
}
// Read dimensions before decoding to avoid allocating a canvas for oversized images.
export async function inspectImage(file: Blob): Promise<ImageInfo> {
  if (!file.size) throw Error("This file is empty. Choose a JPG, PNG or WebP image.");
  if (file.size > MAX_FILE_BYTES) throw Error("Choose an image no larger than 20 MB.");
  const data = new Uint8Array(await file.arrayBuffer()), view = new DataView(data.buffer);
  const text = (start: number, length: number) => String.fromCharCode(...data.subarray(start, start + length));
  let width = 0, height = 0, format: ImageFormat;
  if (data.length >= 24 && text(0, 8) === "\x89PNG\r\n\x1a\n" && text(12, 4) === "IHDR") {
    format = "image/png"; width = view.getUint32(16); height = view.getUint32(20);
  } else if (data.length >= 12 && text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    format = "image/webp";
    for (let p = 12; p + 8 <= data.length;) {
      const kind = text(p, 4), size = view.getUint32(p + 4, true), at = p + 8;
      if (at + size > data.length) break;
      if (kind === "ANIM") throw Error("Animated WebP is not supported. Choose a still image.");
      if (kind === "VP8X" && size >= 10) {
        if (data[at] & 2) throw Error("Animated WebP is not supported. Choose a still image.");
        width = 1 + data[at + 4] + (data[at + 5] << 8) + (data[at + 6] << 16);
        height = 1 + data[at + 7] + (data[at + 8] << 8) + (data[at + 9] << 16);
      } else if (kind === "VP8 " && size >= 10 && !width) {
        width = view.getUint16(at + 6, true) & 0x3fff; height = view.getUint16(at + 8, true) & 0x3fff;
      } else if (kind === "VP8L" && size >= 5 && !width) {
        const bits = view.getUint32(at + 1, true); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
      }
      p = at + size + (size % 2);
    }
  } else if (data[0] === 0xff && data[1] === 0xd8) {
    format = "image/jpeg";
    for (let p = 2; p + 4 < data.length;) {
      if (data[p++] !== 0xff) break;
      while (data[p] === 0xff) p++;
      const marker = data[p++];
      if (marker === 0xd9 || marker === 0xda) break;
      const size = view.getUint16(p);
      if (size < 2 || p + size > data.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && size >= 7) {
        height = view.getUint16(p + 3); width = view.getUint16(p + 5); break;
      }
      p += size;
    }
  } else throw Error("Unsupported file. Choose a real JPG, PNG or WebP image.");
  if (!width || !height) throw Error("This image appears damaged. Choose another JPG, PNG or WebP.");
  if (format === "image/png") {
    for (let p = 8; p + 12 <= data.length;) {
      if (text(p + 4, 4) === "acTL") throw Error("Animated PNG is not supported. Choose a still image.");
      const length = view.getUint32(p); p += length + 12;
    }
  }
  dimensions(width, height);
  return { width, height, format };
}
async function decode(file: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    const image = await createImageBitmap(file);
    return { image, width: image.width, height: image.height, close: () => image.close() };
  }
  if (typeof document === "undefined") throw Error("This browser cannot decode images in a worker.");
  const url = URL.createObjectURL(file), image = new Image();
  try { image.src = url; await image.decode(); return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => { image.src = ""; } }; }
  finally { URL.revokeObjectURL(url); }
}
export async function compressImage(file: Blob, settings: CompressionSettings, progress: (message: string) => void = () => {}, signal?: AbortSignal): Promise<CompressionResult> {
  const info = await inspectImage(file);
  if (!["image/jpeg", "image/png", "image/webp"].includes(settings.format) || !Number.isFinite(settings.quality) || settings.quality < .1 || settings.quality > 1 || !Number.isFinite(settings.target) || settings.target < 1000 || settings.target > MAX_FILE_BYTES) throw Error("Check your compression settings.");
  let source;
  try { source = await decode(new Blob([file], { type: info.format })); }
  catch { throw Error("Could not decode this image. It may be damaged or too large for your device. Try a smaller image."); }
  let canvas: OffscreenCanvas | HTMLCanvasElement | undefined;
  try {
    dimensions(source.width, source.height);
    const original = { ...info, width: source.width, height: source.height };
    if (settings.mode === "target" && file.size <= settings.target && info.format === settings.format) return { ...original, original, blob: new Blob([file], { type: info.format }), unchanged: true };
    const workerCanvas = typeof document === "undefined";
    canvas = workerCanvas ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
    const context = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) throw Error("Image processing is unavailable. Try a different browser.");
    const started = Date.now();
    let attempts = 0;
    let smallest: CompressionResult | undefined;
    const encode = async (width: number, height: number, quality: number) => {
      if (signal?.aborted) throw Error("Processing cancelled.");
      progress(`Processing image locally · attempt ${++attempts}`);
      // Yield in the fallback so controls can repaint between encodes.
      if (!workerCanvas) await new Promise(resolve => setTimeout(resolve, 0));
      const blob = typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas ? await canvas.convertToBlob({ type: settings.format, quality }) : await new Promise<Blob>((resolve, reject) => (canvas as HTMLCanvasElement).toBlob(value => value ? resolve(value) : reject(Error("Image export failed. Try a smaller image.")), settings.format, quality));
      if (blob.type !== settings.format) throw Error("Your browser cannot export this format. Select PNG or JPEG and try again.");
      if (!blob.size) throw Error("Image export failed. Try a smaller image.");
      const result: CompressionResult = { blob, width, height, format: settings.format, original, unchanged: false };
      if (!smallest || blob.size < smallest.blob.size) smallest = result;
      return result;
    };
    let scale = Math.min(1, 4096 / Math.max(source.width, source.height));
    for (let round = 0; round < 8; round++) {
      const width = Math.max(1, Math.round(source.width * scale)), height = Math.max(1, Math.round(source.height * scale));
      canvas.width = width; canvas.height = height;
      if (settings.format === "image/jpeg") { context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); }
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
      context.drawImage(source.image, 0, 0, width, height);
      const high = await encode(width, height, settings.mode === "quality" ? settings.quality : .95);
      if (settings.mode === "quality" || high.blob.size <= settings.target) return high;
      if (settings.format !== "image/png") {
        const low = await encode(width, height, .35);
        if (low.blob.size <= settings.target) {
          let best = low, lo = .35, hi = .95;
          for (let step = 0; step < 6 && Date.now() - started < 15000; step++) {
            const q = (lo + hi) / 2, candidate = await encode(width, height, q);
            if (candidate.blob.size <= settings.target) { best = candidate; lo = q; } else hi = q;
          }
          return best;
        }
      }
      if (Date.now() - started > 15000 || Math.max(width, height) <= 128) break;
      scale *= Math.min(.8, Math.max(.4, Math.sqrt(settings.target / smallest!.blob.size) * .9));
    }
    return smallest!;
  } finally { source.close(); if (canvas) { canvas.width = 1; canvas.height = 1; } }
}
