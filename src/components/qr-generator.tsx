"use client";

import { useEffect, useRef, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import { emptyQrFields, qrByteString, qrContent, qrContrast, type QrFields, type QrType } from "@/lib/qr-content";

const types: [QrType, string][] = [["url", "Website URL"], ["text", "Plain text"], ["wifi", "Wi-Fi"], ["email", "Email"], ["phone", "Phone number"]];
export function QrGenerator() {
  const [type, setType] = useState<QrType>("url");
  const [fields, setFields] = useState<QrFields>({ ...emptyQrFields });
  const [foreground, setForeground] = useState("#252b25"), [background, setBackground] = useState("#ffffff");
  const [style, setStyle] = useState<"square" | "rounded">("square"), [size, setSize] = useState(1024);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false), [retry, setRetry] = useState(0);
  const preview = useRef<HTMLDivElement>(null), code = useRef<QRCodeStyling | null>(null);
  const rendered = useRef("");
  const content = qrContent(type, fields), contrast = qrContrast(foreground, background);
  const key = JSON.stringify([content.data, foreground, background, style, size]);
  const validPreview = ready && rendered.current === key && !!content.data && !content.error;
  function update<K extends keyof QrFields>(field: K, value: QrFields[K]) { setFields(previous => ({ ...previous, [field]: value })); }
  useEffect(() => {
    let cancelled = false;
    setReady(false); setError(""); code.current = null; preview.current?.replaceChildren();
    if (!content.data) { setBusy(false); return; }
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const { default: QR } = await import("qr-code-styling");
        if (cancelled) return;
        // 10% on each side exceeds four modules even for the smallest QR.
        const qr = new QR({ width: size, height: size, type: "svg", data: qrByteString(content.data), margin: Math.ceil(size * .1),
          qrOptions: { errorCorrectionLevel: "Q", mode: "Byte" },
          dotsOptions: { color: foreground, type: style }, backgroundOptions: { color: background },
          cornersSquareOptions: { type: "square", color: foreground }, cornersDotOptions: { type: "square", color: foreground } });
        await qr.getRawData("svg");
        if (cancelled || !preview.current) return;
        preview.current.replaceChildren(); qr.append(preview.current); code.current = qr; rendered.current = key; setReady(true);
      } catch { if (!cancelled) setError("Could not generate this QR code. Shorten the content or try again."); }
      finally { if (!cancelled) setBusy(false); }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [content.data, foreground, background, style, size, key, retry]);
  async function download(extension: "png" | "svg") {
    if (!validPreview || !code.current) return;
    setDownloading(true); setError("");
    try {
      const blob = await code.current.getRawData(extension);
      if (!(blob instanceof Blob) || !blob.size) throw Error();
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = `john-semblante-qr-code.${extension}`; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError("Download failed. Please try again or choose the other format."); }
    finally { setDownloading(false); }
  }
  function reset() { setType("url"); setFields({ ...emptyQrFields }); setForeground("#252b25"); setBackground("#ffffff"); setStyle("square"); setSize(1024); setError(""); setRetry(value => value + 1); }
  const input = (field: keyof QrFields, label: string, inputType = "text", placeholder = "") => <label>{label}<input type={inputType} value={String(fields[field])} onChange={event => update(field, event.target.value as never)} placeholder={placeholder} autoComplete="off" spellCheck={false} /></label>;
  return <div className="qr-layout">
    <form className="qr-panel" onSubmit={event => event.preventDefault()} autoComplete="off">
      <h2>Make it yours.</h2><label>QR content type<select value={type} onChange={event => setType(event.target.value as QrType)}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <fieldset><legend>1. Add your content</legend>
        {type === "url" && input("url", "Website URL", "url", "https://example.com")}
        {type === "text" && <label>Plain text<textarea rows={5} value={fields.text} onChange={event => update("text", event.target.value)} /></label>}
        {type === "wifi" && <>{input("ssid", "Network name (SSID)")}<label>Security<select value={fields.security} onChange={event => update("security", event.target.value as QrFields["security"])}><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label>{fields.security !== "nopass" && input("password", "Network password", "password")}<label className="qr-checkbox"><input type="checkbox" checked={fields.hidden} onChange={event => update("hidden", event.target.checked)} />Hidden network</label></>}
        {type === "email" && <>{input("email", "Email address", "email")}{input("subject", "Subject (optional)")}<label>Message (optional)<textarea rows={4} value={fields.message} onChange={event => update("message", event.target.value)} /></label></>}
        {type === "phone" && input("phone", "Phone number", "tel", "+63 912 345 6789")}
      </fieldset>
      <p className="qr-feedback" role="status">{content.error || "Content limit: 1,600 UTF-8 bytes. Longer content makes a denser code."}</p>
      <fieldset><legend>2. Choose your design</legend><div className="qr-settings"><label>Foreground<input type="color" value={foreground} onChange={event => setForeground(event.target.value)} /></label><label>Background<input type="color" value={background} onChange={event => setBackground(event.target.value)} /></label><label>Dot style<select value={style} onChange={event => setStyle(event.target.value as typeof style)}><option value="square">Square</option><option value="rounded">Rounded</option></select></label><label>Download size<select value={size} onChange={event => setSize(Number(event.target.value))}>{[512, 1024, 2048].map(value => <option key={value} value={value}>{value} × {value} px</option>)}</select></label></div></fieldset>
      {(contrast.ratio < 4.5 || contrast.inverted) && <p role="status" className="qr-warning">Scanning warning: use a dark foreground on a light background with strong contrast. Test your code before sharing.</p>}
      <button className="button secondary" type="button" onClick={reset}>Reset all</button>
    </form>
    <section className="qr-panel qr-result" aria-labelledby="qr-preview-title"><p className="eyebrow">Your static QR code</p><h2 id="qr-preview-title">Ready to share.</h2>
      <div className="qr-preview" aria-busy={busy}><div ref={preview} hidden={!validPreview} role="img" aria-label="Generated QR code" />{!validPreview && <p role="status">{busy ? "Generating your QR code…" : "Add valid content to see your QR code here."}</p>}</div>
      {error && <p role="alert" className="qr-warning">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></p>}
      <div className="actions"><button type="button" className="button" disabled={!validPreview || downloading} onClick={() => void download("png")}>{downloading ? "Preparing download…" : "Download PNG"}</button><button type="button" className="button secondary" disabled={!validPreview || downloading} onClick={() => void download("svg")}>Download SVG</button></div>
      <p className="qr-feedback">Generated locally in your browser. Your entries and QR images are never uploaded or saved by this tool. Anyone who scans your code can read its contents; share Wi-Fi codes carefully.</p><p className="qr-feedback">Scan the downloaded code with your phone before printing or sharing. Keep the blank border intact.</p>
    </section>
  </div>;
}
