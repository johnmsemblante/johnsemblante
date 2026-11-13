"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask, PDFPageProxy, RenderTask } from "pdfjs-dist";
import type { PageViewport } from "pdfjs-dist/types/src/display/page_viewport";
import { PDF_LIMITS, normalizeRotation, validatePdfBytes, type EditorPage, type PdfAnnotation } from "@/lib/pdf-editor-model";

function textImage(text: string, size: number, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = `${size * 2}px Arial`;
  const width = Math.min(4000, Math.max(4, Math.ceil(context.measureText(text).width + 8)));
  canvas.width = width; canvas.height = Math.ceil(size * 2.8);
  context.font = `${size * 2}px Arial`; context.fillStyle = color;
  context.textBaseline = "top"; context.fillText(text, 4, size * .2);
  return { png: canvas.toDataURL("image/png"), width: width / 2, height: canvas.height / 2 };
}

function PageCanvas({ pdf, page, scale, ready, failed }: { pdf: PDFDocumentProxy; page: EditorPage; scale: number; ready?: (viewport: PageViewport | null) => void; failed: (message: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false, task: RenderTask | undefined, proxy: PDFPageProxy | undefined;
    const canvas = ref.current!;
    ready?.(null);
    (async () => {
      try {
        proxy = await pdf.getPage(page.sourceIndex + 1);
        if (disposed) return;
        const viewport = proxy.getViewport({ scale, rotation: page.rotation });
        const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8_000_000 / (viewport.width * viewport.height)));
        canvas.width = Math.ceil(viewport.width * ratio); canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
        task = proxy.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport, transform: [ratio, 0, 0, ratio, 0, 0], annotationMode: 0 });
        await task.promise;
        if (!disposed) ready?.(viewport);
      } catch (error) {
        if (!disposed) failed(error instanceof Error ? `Page preview failed: ${error.message}. Try a smaller document.` : "Page preview failed. Try a smaller document.");
      }
    })();
    return () => { disposed = true; task?.cancel(); canvas.width = 0; canvas.height = 0; };
  }, [pdf, page.sourceIndex, page.rotation, scale, ready, failed]);
  return <canvas ref={ref} aria-label={`PDF page ${page.sourceIndex + 1} preview`} />;
}

function SignaturePad({ useSignature }: { useSignature: (png: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), drawing = useRef(false), ink = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  function draw(event: PointerEvent<HTMLCanvasElement>, start: boolean) {
    const surface = canvas.current!, rect = surface.getBoundingClientRect(), context = surface.getContext("2d")!;
    const x = (event.clientX - rect.left) * surface.width / rect.width, y = (event.clientY - rect.top) * surface.height / rect.height;
    if (start) { drawing.current = true; surface.setPointerCapture(event.pointerId); context.beginPath(); context.moveTo(x, y); }
    else if (!drawing.current) return;
    context.lineWidth = 3; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = "#111111";
    context.lineTo(x + .01, y + .01); context.stroke(); ink.current = true; setHasInk(true);
  }
  return <details className="pdf-signature"><summary>Draw a signature</summary><p>Draw below with a mouse or touch, then choose Use signature and tap the page. This is a drawn electronic signature, without certificate verification.</p>
    <canvas aria-label="Draw your signature here using a mouse or touch" ref={canvas} width={600} height={200} onPointerDown={e => draw(e, true)} onPointerMove={e => draw(e, false)} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <button type="button" onClick={() => { canvas.current!.getContext("2d")!.clearRect(0, 0, 600, 200); ink.current = false; setHasInk(false); }}>Clear signature</button>{" "}
    <button type="button" disabled={!hasInk} onClick={() => { if (ink.current) useSignature(canvas.current!.toDataURL("image/png")); }}>Use signature</button>
  </details>;
}

export function PdfEditor() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null), [pages, setPages] = useState<EditorPage[]>([]);
  const [fileInfo, setFileInfo] = useState({ name: "", size: 0 });
  const original = useRef<Uint8Array | null>(null), activePdf = useRef<PDFDocumentProxy | null>(null), loading = useRef<PDFDocumentLoadingTask | null>(null), generation = useRef(0);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState("Choose a PDF to begin."), [error, setError] = useState("");
  const [current, setCurrent] = useState(0), [zoom, setZoom] = useState(1), [fit, setFit] = useState(true), [width, setWidth] = useState(700);
  const [viewport, setViewport] = useState<PageViewport | null>(null), [base, setBase] = useState({ width: 600, height: 800 });
  const [mode, setMode] = useState<"select" | "text" | "signature">("select"), [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("Your text"), [size, setSize] = useState(18), [color, setColor] = useState("#111111"), [signature, setSignature] = useState("");
  const [past, setPast] = useState<EditorPage[][]>([]), [future, setFuture] = useState<EditorPage[][]>([]);
  const workspace = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; original: PdfAnnotation; saved: boolean } | null>(null);
  const page = pages[Math.min(current, pages.length - 1)];
  const annotation = page?.annotations.find(a => a.id === selected);
  const scale = fit ? Math.min((width - 32) / base.width, 760 / base.height, 1.5) : zoom;
  // Stable callbacks prevent annotation edits from restarting PDF rendering.
  const [onReady] = useState(() => (v: PageViewport | null) => { setViewport(v); setStatus(v ? "Ready to edit." : "Rendering page…"); });
  const [onFailed] = useState(() => (message: string) => { setError(message); setViewport(null); });
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(180, entries[0].contentRect.width)));
    if (workspace.current) observer.observe(workspace.current);
    return () => observer.disconnect();
  }, [pdf]);
  useEffect(() => () => { generation.current++; void loading.current?.destroy(); void activePdf.current?.loadingTask.destroy(); original.current = null; }, []);
  useEffect(() => {
    let stale = false;
    setViewport(null); setSelected(null);
    if (pdf && page) {
      void pdf.getPage(page.sourceIndex + 1).then(p => { if (!stale) { const v = p.getViewport({ scale: 1, rotation: page.rotation }); setBase({ width: v.width, height: v.height }); } }).catch(() => { if (!stale) setError("This page could not be loaded."); });
    }
    return () => { stale = true; };
  }, [pdf, page?.id, page?.rotation]);
  function update(next: EditorPage[], save = true) { if (save) { setPast(items => [...items.slice(-19), pages]); setFuture([]); } setPages(next); }
  function changeAnnotation(next: PdfAnnotation, save = true) { update(pages.map(p => p.id === page.id ? { ...p, annotations: p.annotations.map(a => a.id === next.id ? next : a) } : p), save); }
  function clear() {
    generation.current++; void loading.current?.destroy(); loading.current = null;
    void activePdf.current?.loadingTask.destroy(); activePdf.current = null; original.current = null;
    setPdf(null); setPages([]); setPast([]); setFuture([]); setViewport(null); setSelected(null); setSignature(""); setMode("select"); setBusy(false); setError(""); setStatus("Choose a PDF to begin.");
  }
  async function open(file: File) {
    if (pages.length && !window.confirm("Replace this document and discard its edits?")) return;
    clear(); const token = generation.current;
    setBusy(true); setStatus("Loading and checking PDF…");
    let candidate: PDFDocumentProxy | null = null;
    try {
      if (file.size > PDF_LIMITS.bytes) throw new Error("Choose a PDF smaller than 20 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer()); validatePdfBytes(bytes);
      const [renderer, { PDFDocument }] = await Promise.all([import("pdfjs-dist"), import("pdf-lib")]);
      if (token !== generation.current) return;
      // pdf-lib rejects encrypted PDFs, including those with an empty opening password.
      const checked = await PDFDocument.load(bytes.slice(), { updateMetadata: false });
      if (!checked.getPageCount() || checked.getPageCount() > PDF_LIMITS.pages) throw new Error("Choose a PDF containing 1–100 pages.");
      renderer.GlobalWorkerOptions.workerSrc = `/tools/pdf-editor/pdf.worker-${renderer.version}.min.mjs`;
      const task = renderer.getDocument({ data: bytes.slice(), cMapUrl: "/tools/pdf-editor/cmaps/", cMapPacked: true, standardFontDataUrl: "/tools/pdf-editor/standard_fonts/", wasmUrl: "/tools/pdf-editor/wasm/", useWasm: true });
      loading.current = task;
      task.onPassword = () => { void task.destroy(); };
      candidate = await task.promise;
      if (candidate.numPages !== checked.getPageCount()) throw new Error("The PDF page structure is inconsistent. Try another PDF.");
      const metadata: EditorPage[] = [];
      for (let index = 0; index < candidate.numPages; index++) {
        const p = await candidate.getPage(index + 1), v = p.getViewport({ scale: 1 });
        if (Math.max(v.width, v.height) > PDF_LIMITS.side || Math.min(v.width, v.height) <= 0) throw new Error("A PDF page is too large for this browser editor.");
        metadata.push({ id: `page-${index}`, sourceIndex: index, rotation: normalizeRotation(p.rotate), annotations: [] });
      }
      const permissions = await candidate.getPermissions();
      if (permissions && !permissions.has(renderer.PermissionFlag.MODIFY_CONTENTS)) throw new Error("This PDF restricts editing. Use an unrestricted copy from its owner.");
      if (token !== generation.current) { await candidate.loadingTask.destroy(); return; }
      original.current = bytes; activePdf.current = candidate; loading.current = null;
      setPdf(candidate); setPages(metadata); setFileInfo({ name: file.name, size: file.size }); setCurrent(0); setFit(true); setZoom(1); setStatus("Rendering page…");
    } catch (cause) {
      if (candidate) void candidate.loadingTask.destroy();
      if (token === generation.current) {
        const message = cause instanceof Error ? cause.message : "Unable to decode this PDF.";
        setError(/encrypt|password/i.test(message) ? "Password-protected or encrypted PDFs are not supported. Use an unrestricted, unencrypted copy from the document owner." : `Could not open PDF: ${message} Try a smaller, valid PDF if your browser runs out of memory.`);
        setStatus("No document loaded.");
      }
    } finally { if (token === generation.current) { setBusy(false); loading.current = null; } }
  }
  function point(clientX: number, clientY: number) {
    const rect = stage.current!.getBoundingClientRect();
    return viewport!.convertToPdfPoint((clientX - rect.left) * viewport!.width / rect.width, (clientY - rect.top) * viewport!.height / rect.height);
  }
  function place(event: PointerEvent<HTMLDivElement>) {
    if (!viewport || busy || mode === "select" || event.target !== event.currentTarget) return;
    if (mode === "text" && !text.trim()) { setError("Enter text before placing it."); return; }
    const [x, y] = point(event.clientX, event.clientY);
    const content = mode === "text" ? textImage(text, size, color) : { png: signature, width: 180, height: 60 };
    if (!content.png) return;
    const a: PdfAnnotation = { id: crypto.randomUUID(), kind: mode, x, y, angle: page.rotation, ...content, ...(mode === "text" ? { text, size, color } : {}) };
    update(pages.map(p => p.id === page.id ? { ...p, annotations: [...p.annotations, a] } : p)); setSelected(a.id); setMode("select"); setError("");
  }
  function nudge(dx: number, dy: number) {
    if (!annotation || !viewport) return;
    const [sx, sy] = viewport.convertToViewportPoint(annotation.x, annotation.y), [x, y] = viewport.convertToPdfPoint(sx + dx * scale, sy + dy * scale);
    changeAnnotation({ ...annotation, x, y });
  }
  async function download() {
    if (!original.current || busy) return;
    setBusy(true); setError(""); setStatus("Preparing edited PDF…");
    try {
      const { exportEditedPdf } = await import("@/lib/pdf-editor-export");
      const bytes = await exportEditedPdf(original.current, pages);
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${fileInfo.name.replace(/\.pdf$/i, "") || "document"}-edited.pdf`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000); setStatus("Edited PDF downloaded. Review it before sharing.");
    } catch { setError("Export failed. Your edits are still here. Try removing a large signature or use a smaller PDF. Keep your original file."); setStatus("Download failed."); }
    finally { setBusy(false); }
  }
  return <div className="pdf-editor" aria-busy={busy}>
    <div className="pdf-file" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) { if (e.dataTransfer.files.length !== 1) setError("Choose one PDF at a time."); else void open(e.dataTransfer.files[0]); } }}>
      <strong>{pdf ? "Choose another PDF" : "A little paperwork, made easier."}</strong><p>Drop one PDF here or browse your device. Up to 20 MB and 100 pages. Files stay in this tab.</p>
      <label className="pdf-picker">{pdf ? "Replace PDF" : "Choose PDF"}<input disabled={busy} type="file" accept="application/pdf,.pdf" onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void open(file); }} /></label>
      {pdf && <button disabled={busy} onClick={() => { if (window.confirm("Clear this PDF and all edits?")) clear(); }}>Clear document</button>}
    </div>
    <p role="status">{status}</p>{error && <p role="alert" className="pdf-error">{error}</p>}
    {pdf && page && <>
      <p className="pdf-info"><strong>{fileInfo.name}</strong> · {(fileInfo.size / 1_000_000).toFixed(2)} MB · {pages.length} pages · Current page {current + 1}</p>
      <fieldset disabled={busy} className="pdf-controls"><legend>Editing tools</legend>
        <div className="pdf-row"><button aria-pressed={mode === "select"} onClick={() => setMode("select")}>Select / move</button><button aria-pressed={mode === "text"} onClick={() => setMode("text")}>Add text</button>
          <button disabled={!past.length} onClick={() => { setFuture([pages, ...future]); setPages(past[past.length - 1]); setPast(past.slice(0, -1)); setCurrent(0); setSelected(null); }}>Undo</button>
          <button disabled={!future.length} onClick={() => { setPast([...past, pages]); setPages(future[0]); setFuture(future.slice(1)); setCurrent(0); setSelected(null); }}>Redo</button>
          <button className="pdf-download" onClick={() => void download()}>Download Edited PDF</button></div>
        <div className="pdf-row"><label>Text <input value={text} maxLength={200} onChange={e => setText(e.target.value)} /></label><label>Font size <input type="number" min={8} max={96} value={size} onChange={e => setSize(Math.min(96, Math.max(8, Number(e.target.value) || 8)))} /></label><label>Color <input type="color" value={color} onChange={e => setColor(e.target.value)} /></label></div>
        <SignaturePad useSignature={png => { setSignature(png); setMode("signature"); setStatus("Tap or click the page to place your signature."); }} />
      </fieldset>
      <fieldset disabled={busy} className="pdf-controls"><legend>Pages and view</legend><div className="pdf-row">
        <button disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</button><label>Page <select value={current} onChange={e => setCurrent(Number(e.target.value))}>{pages.map((p, index) => <option key={p.id} value={index}>{index + 1} of {pages.length}</option>)}</select></label><button disabled={current >= pages.length - 1} onClick={() => setCurrent(current + 1)}>Next</button>
        <button onClick={() => { setViewport(null); update(pages.map(p => p.id === page.id ? { ...p, rotation: normalizeRotation(p.rotation - 90) } : p)); }}>Rotate left</button><button onClick={() => { setViewport(null); update(pages.map(p => p.id === page.id ? { ...p, rotation: normalizeRotation(p.rotation + 90) } : p)); }}>Rotate right</button>
        <button disabled={pages.length === 1} onClick={() => { if (window.confirm(`Delete page ${current + 1} and its added elements? You can undo this.`)) { update(pages.filter(p => p.id !== page.id)); setCurrent(Math.max(0, current - 1)); } }}>Delete page</button>
        <button disabled={scale <= .25} onClick={() => { setZoom(Math.max(.25, scale - .25)); setFit(false); }}>Zoom out</button><span>{Math.round(scale * 100)}%</span><button disabled={scale >= 2} onClick={() => { setZoom(Math.min(2, scale + .25)); setFit(false); }}>Zoom in</button><button aria-pressed={fit} onClick={() => { setFit(true); }}>Fit page</button>
      </div></fieldset>
      <p>{mode === "text" ? "Tap the page to place your text." : mode === "signature" ? "Tap the page to place your signature." : "Select an added element to move or edit it. Drag it, use arrow keys, or use the position buttons."}</p>
      {annotation && <fieldset disabled={busy} className="pdf-controls"><legend>Selected {annotation.kind}</legend><div className="pdf-row">
        {annotation.kind === "text" && <button onClick={() => { if (text.trim()) changeAnnotation({ ...annotation, text, size, color, ...textImage(text, size, color) }); }}>Apply text, size and color</button>}
        {annotation.kind === "signature" && <label>Signature width <input type="range" min={30} max={500} value={annotation.width} onChange={e => { const width = Number(e.target.value); changeAnnotation({ ...annotation, width, height: width * annotation.height / annotation.width }); }} /></label>}
        <button onClick={() => nudge(-5, 0)}>Move left</button><button onClick={() => nudge(5, 0)}>Move right</button><button onClick={() => nudge(0, -5)}>Move up</button><button onClick={() => nudge(0, 5)}>Move down</button>
        <button onClick={() => { update(pages.map(p => p.id === page.id ? { ...p, annotations: p.annotations.filter(a => a.id !== selected) } : p)); setSelected(null); }}>Remove element</button>
      </div></fieldset>}
      <div className="pdf-workspace" ref={workspace}>
        <nav className="pdf-thumbnails" aria-label="Nearby page previews">{pages.map((p, index) => Math.abs(index - current) <= 2 && <button key={p.id} aria-current={current === index ? "page" : undefined} onClick={() => setCurrent(index)} disabled={busy}><PageCanvas pdf={pdf} page={p} scale={.1} failed={onFailed} /><span>Page {index + 1}</span></button>)}</nav>
        <div className="pdf-scroll"><div ref={stage} className={`pdf-stage pdf-mode-${mode}`} style={{ width: base.width * scale, height: base.height * scale }}>
          <PageCanvas pdf={pdf} page={page} scale={scale} ready={onReady} failed={onFailed} />
          {!viewport && <span className="pdf-rendering" role="status">Rendering page…</span>}
          {viewport && <div className="pdf-overlay" onPointerDown={place} onPointerMove={e => {
            const d = drag.current; if (!d || busy) return;
            const [x, y] = point(e.clientX, e.clientY); const [startX, startY] = point(d.x, d.y);
            if (!d.saved) { setPast(items => [...items.slice(-19), pages]); setFuture([]); d.saved = true; }
            changeAnnotation({ ...d.original, x: d.original.x + x - startX, y: d.original.y + y - startY }, false);
          }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
            {page.annotations.map(a => { const [x, y] = viewport.convertToViewportPoint(a.x, a.y); const factor = Math.hypot(viewport.transform[0], viewport.transform[1]); return <button key={a.id} type="button" disabled={busy} className={`pdf-element ${selected === a.id ? "is-selected" : ""}`} aria-label={a.kind === "text" ? `Added text: ${a.text}` : "Added signature"} style={{ left: x, top: y, width: a.width * factor, height: a.height * factor, transform: `rotate(${page.rotation - a.angle}deg)` }}
              onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); setSelected(a.id); setMode("select"); if (a.kind === "text") { setText(a.text!); setSize(a.size!); setColor(a.color!); } drag.current = { id: a.id, x: e.clientX, y: e.clientY, original: a, saved: false }; }}
              onKeyDown={e => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); setSelected(a.id); if (selected === a.id) nudge(e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0, e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0); } }} onFocus={() => setSelected(a.id)}>
              {/* Exact same transparent bitmap is embedded in the output PDF. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src={a.png} alt="" draggable={false} /></button>; })}
          </div>}
        </div></div>
      </div>
    </>}
  </div>;
}
