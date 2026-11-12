export type QrType = "url" | "text" | "wifi" | "email" | "phone";
export type QrFields = { url: string; text: string; ssid: string; password: string; security: "WPA" | "WEP" | "nopass"; hidden: boolean; email: string; subject: string; message: string; phone: string };
export const emptyQrFields: QrFields = { url: "", text: "", ssid: "", password: "", security: "WPA", hidden: false, email: "", subject: "", message: "", phone: "" };
export function escapeWifi(value: string) { return value.replace(/[\\;,:\"]/g, "\\$&"); }
// qr-code-styling 1.9.2 uses qrcode-generator's single-byte string encoder.
// Pass UTF-8 bytes explicitly so non-Latin text and emoji survive scanning.
export function qrByteString(value: string) { return Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(""); }
export function qrContent(type: QrType, fields: QrFields): { data: string; error: string } {
  let data = "";
  const invalid = (error: string) => ({ data: "", error });
  switch (type) {
    case "url": {
      if (!fields.url.trim()) return invalid("");
      try { const url = new URL(fields.url.trim()); if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw Error(); data = url.href; }
      catch { return invalid("Enter a complete HTTP or HTTPS URL, such as https://example.com."); }
      break;
    }
    case "text": data = fields.text; if (!data.trim()) return invalid(""); break;
    case "wifi":
      if (!fields.ssid) return invalid("");
      if (fields.security !== "nopass" && !fields.password) return invalid("Enter the network password or choose Open network.");
      data = `WIFI:T:${fields.security};S:${escapeWifi(fields.ssid)};${fields.security === "nopass" ? "" : `P:${escapeWifi(fields.password)};`}H:${fields.hidden};;`; break;
    case "email": {
      const email = fields.email.trim(); if (!email) return invalid("");
      if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return invalid("Enter a valid email address.");
      const query = [fields.subject && `subject=${encodeURIComponent(fields.subject)}`, fields.message && `body=${encodeURIComponent(fields.message)}`].filter(Boolean).join("&");
      data = `mailto:${encodeURIComponent(email).replace(/%40/g, "@")}${query ? `?${query}` : ""}`; break;
    }
    case "phone": {
      if (!fields.phone.trim()) return invalid("");
      const phone = fields.phone.replace(/[\s().-]/g, "");
      if (!/^\+?\d{3,15}$/.test(phone)) return invalid("Use 3–15 digits, with an optional leading + and spaces, parentheses or hyphens.");
      data = `tel:${phone}`; break;
    }
  }
  // Conservative UTF-8 byte ceiling for byte-mode QR at Q error correction.
  if (new TextEncoder().encode(data).length > 1600) return invalid("This content is too long. Shorten it to 1,600 UTF-8 bytes or fewer.");
  return { data, error: "" };
}
export function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map(value => { const c = parseInt(value, 16) / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
export function qrContrast(foreground: string, background: string) {
  const dark = luminance(foreground), light = luminance(background);
  return { ratio: (Math.max(dark, light) + .05) / (Math.min(dark, light) + .05), inverted: dark >= light };
}
