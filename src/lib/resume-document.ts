import { resumeEntryHasContent, resumeFilename, resumeLines, resumeSectionHasContent, resumeSectionLabels, type Resume, type ResumeEntry } from "./resume-model";

export function escapeResumeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
export function safeResumeUrl(value: string): string | null {
  if (!value.trim()) return null;
  if (/^[\\/]/.test(value.trim()) || (/^[a-z][a-z\d+.-]*:/i.test(value.trim()) && !/^https?:\/\//i.test(value.trim()))) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !url.hostname.includes(".") || /[\s<>]/.test(value)) return null;
    return url.href;
  } catch { return null; }
}
function link(value: string): string {
  const url = safeResumeUrl(value);
  return url ? `<a href="${escapeResumeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeResumeHtml(value.trim())}</a>` : escapeResumeHtml(value.trim());
}
function entryHtml(entry: ResumeEntry): string {
  const bullets = resumeLines(entry.highlights);
  return `<article class="entry"><div class="entry-heading"><h3>${escapeResumeHtml([entry.title.trim(), entry.organization.trim()].filter(Boolean).join(" | "))}</h3>${entry.dates.trim() ? `<span>${escapeResumeHtml(entry.dates)}</span>` : ""}</div>${entry.location.trim() ? `<p class="entry-location">${escapeResumeHtml(entry.location)}</p>` : ""}${entry.url.trim() ? `<p>${link(entry.url)}</p>` : ""}${bullets.length ? `<ul>${bullets.map(line => `<li>${escapeResumeHtml(line)}</li>`).join("")}</ul>` : ""}</article>`;
}
/** A self-contained document: no scripts, remote fonts, images or services. */
export function resumeDocument(resume: Resume): string {
  const sections = resume.order.filter(key => !resume.hidden.includes(key) && resumeSectionHasContent(resume, key)).map(key => {
    const value = resume[key];
    let content: string;
    if (typeof value !== "string") content = value.filter(resumeEntryHasContent).map(entryHtml).join("");
    else if (key === "certifications") content = `<ul>${resumeLines(value).map(line => `<li>${escapeResumeHtml(line)}</li>`).join("")}</ul>`;
    else content = `<p class="multiline">${escapeResumeHtml(value.trim())}</p>`;
    return `<section><h2>${resumeSectionLabels[key]}</h2>${content}</section>`;
  }).join("");
  const contacts = [resume.email, resume.phone, resume.location].map(value => value.trim()).filter(Boolean).map(escapeResumeHtml);
  const links = [resume.website, resume.linkedin].filter(value => value.trim()).map(link);
  const compact = resume.spacing === "compact", classic = resume.template === "classic";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeResumeHtml(resumeFilename(resume))}</title><style>
@page{size:${resume.paper === "letter" ? "Letter" : "A4"};margin:16mm 17mm}
*{box-sizing:border-box}html{background:#fff;color:#202822}body{margin:0;font-family:${classic ? "Georgia,'Times New Roman',serif" : "Arial,Helvetica,sans-serif"};font-size:${compact ? "10" : "10.5"}pt;line-height:${compact ? "1.38" : "1.5"};overflow-wrap:anywhere}main{padding:16mm 17mm;max-width:100%}header{border-bottom:${classic ? "1px solid #333" : "3px solid #45613d"};padding-bottom:14px;margin-bottom:18px}h1{font-size:28pt;line-height:1.13;letter-spacing:-.7pt;margin:0 0 7px;font-weight:700}header .headline{font-size:13pt;margin:0 0 10px;color:${classic ? "#333" : "#45613d"}}.contact{font-size:9pt;margin:4px 0}h2{font-family:Arial,Helvetica,sans-serif;font-size:10pt;text-transform:uppercase;letter-spacing:0;margin:0 0 9px;padding-bottom:5px;border-bottom:1px solid #ccd2ca;color:${classic ? "#222" : "#37542f"};break-after:avoid}h3{font-size:10.5pt;line-height:1.4;margin:0}.entry-heading{display:flex;justify-content:space-between;align-items:baseline;gap:14px;break-after:avoid}.entry-heading>span{font-size:9pt;flex-shrink:0;max-width:43%;text-align:right}.entry-location{font-size:9pt;color:#485247}section{margin-top:${compact ? "15" : "21"}px}.entry{margin-bottom:${compact ? "12" : "17"}px}p{margin:4px 0}ul{margin:6px 0 0;padding-left:18px}li{padding-left:2px;margin-bottom:${compact ? "2" : "4"}px;break-inside:avoid}.multiline{white-space:pre-line}a{color:inherit;text-decoration:underline;text-underline-offset:2px}.empty{padding:60px 0;color:#66715e}section>h2+*,.entry-heading+p{break-before:avoid}p{orphans:3;widows:3}header{break-inside:avoid}
@media print{html,body{width:auto;min-height:0}main{padding:0}a{text-decoration:none}header,h2{-webkit-print-color-adjust:exact;print-color-adjust:exact}.empty{display:none}}
</style></head><body><main><header>${resume.name.trim() ? `<h1>${escapeResumeHtml(resume.name)}</h1>` : ""}${resume.headline.trim() ? `<p class="headline">${escapeResumeHtml(resume.headline)}</p>` : ""}${contacts.length ? `<p class="contact">${contacts.join(" · ")}</p>` : ""}${links.length ? `<p class="contact">${links.join(" · ")}</p>` : ""}</header>${sections || (!resume.name.trim() ? '<p class="empty">Your résumé starts here. Add your details or start from your public profile.</p>' : "")}</main></body></html>`;
}
