"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAdmin } from "./admin-gate";
import { useAdminActivity, useAdminMessage } from "./use-admin-feedback";
import { useResumeDraft } from "./use-resume-draft";
import { resumeDocument, safeResumeUrl } from "@/lib/resume-document";
import { resumeFromPublicProfile } from "@/lib/resume-profile";
import { emptyResumeEntry, moveResumeItem, readResumeBackup, RESUME_MAX_BYTES, RESUME_MAX_ENTRIES, resumeEntryHasContent, resumeFilename, resumeHasContent, resumeSectionHasContent, resumeSectionLabels, resumeToText, type Resume, type ResumeEntry, type ResumeSectionKey } from "@/lib/resume-model";

function Field({ label, value, onChange, multiline = false, maxLength = 300, hint, type = "text", placeholder }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; maxLength?: number; hint?: string; type?: string; placeholder?: string;
}) {
  const id = useId();
  return <div className="resume-field"><label htmlFor={id}>{label}</label>{multiline
    ? <textarea id={id} value={value} onChange={event => onChange(event.target.value)} rows={5} maxLength={maxLength} aria-describedby={hint ? `${id}-hint` : undefined} placeholder={placeholder} />
    : <input id={id} type={type} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} aria-describedby={hint ? `${id}-hint` : undefined} placeholder={placeholder} />}
    {hint && <p className="form-note" id={`${id}-hint`}>{hint}</p>}</div>;
}

function EntryEditor({ section, entry, index, total, update, move, remove }: {
  section: "experience" | "education" | "projects"; entry: ResumeEntry; index: number; total: number;
  update: (next: ResumeEntry) => void; move: (direction: -1 | 1) => void; remove: () => void;
}) {
  const title = section === "education" ? "Degree or qualification" : section === "projects" ? "Project name / role" : "Job title";
  return <fieldset className="resume-entry"><legend>{entry.title.trim() || `${section === "education" ? "Education" : section === "projects" ? "Project" : "Position"} ${index + 1}`}</legend>
    <div className="resume-entry-actions"><button type="button" className="resume-control" onClick={() => move(-1)} disabled={index === 0} aria-label={`Move ${entry.title || `entry ${index + 1}`} up`}>↑</button><button type="button" className="resume-control" onClick={() => move(1)} disabled={index === total - 1} aria-label={`Move ${entry.title || `entry ${index + 1}`} down`}>↓</button><button type="button" className="resume-control resume-remove" onClick={remove}>Remove<span className="sr-only"> {entry.title || `entry ${index + 1}`}</span></button></div>
    <Field label={title} value={entry.title} onChange={title => update({ ...entry, title })} />
    <Field label={section === "education" ? "School / institution" : section === "projects" ? "Client / organization (optional)" : "Company"} value={entry.organization} onChange={organization => update({ ...entry, organization })} />
    <div className="resume-field-row"><Field label="Dates" value={entry.dates} onChange={dates => update({ ...entry, dates })} placeholder="Jan 2023 – Present" /><Field label="Location (optional)" value={entry.location} onChange={location => update({ ...entry, location })} /></div>
    <Field label={section === "projects" ? "Project URL (optional)" : "Reference URL (optional)"} value={entry.url} onChange={url => update({ ...entry, url })} hint={entry.url && !safeResumeUrl(entry.url) ? "Use a full http(s) URL or a domain. This value will otherwise be shown as plain text." : undefined} />
    <Field label={section === "education" ? "Highlights (optional)" : "Achievements & responsibilities"} value={entry.highlights} onChange={highlights => update({ ...entry, highlights })} multiline maxLength={6000} hint="One bullet per line. Use specific, truthful examples; include numbers only when you can verify them." />
  </fieldset>;
}

function ResumePreview({ resume }: { resume: Resume }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(460);
  const paperWidth = resume.paper === "a4" ? 794 : 816;
  const paperHeight = resume.paper === "a4" ? 1123 : 1056;
  const [height, setHeight] = useState(paperHeight);
  const document = useMemo(() => resumeDocument(resume), [resume]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  const scale = Math.min(width / paperWidth, 1);
  return <div ref={container} className="resume-preview-viewport"><div className="resume-preview-sheet" style={{ width: paperWidth * scale, height: Math.max(height, paperHeight) * scale }}><iframe title="Live résumé preview" sandbox="allow-same-origin" referrerPolicy="no-referrer" srcDoc={document} onLoad={event => setHeight(event.currentTarget.contentDocument?.body.scrollHeight || paperHeight)} style={{ width: paperWidth, height: Math.max(height, paperHeight), transform: `scale(${scale})` } as CSSProperties} /></div></div>;
}

export function ResumeGenerator() {
  const { user } = useAdmin();
  return <ResumeWorkspace key={user.uid} uid={user.uid} />;
}

/** Exported separately for local UI fixtures without bypassing the real admin gate. */
export function ResumeWorkspace({ uid }: { uid: string }) {
  const { resume, setResume, saving, status, conflict, resolveConflict, toggleSaving, clearDraft } = useResumeDraft(uid);
  const [error, setError] = useAdminMessage("error");
  const [message, setMessage] = useAdminMessage("success");
  const [busy, setBusy] = useState(false);
  const settingsId = useId();
  const latestResume = useRef(resume);
  latestResume.current = resume;
  const importInput = useRef<HTMLInputElement>(null);
  const printFrame = useRef<HTMLIFrameElement | null>(null);
  useAdminActivity(busy, "Reading your résumé backup…");
  useEffect(() => () => printFrame.current?.remove(), []);
  useEffect(() => {
    if (saving && !conflict) return;
    const warn = (event: BeforeUnloadEvent) => { if (resume && resumeHasContent(resume)) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [resume, saving, conflict]);

  if (!resume) return <p role="status">Loading your résumé workspace…</p>;
  const change = <K extends keyof Resume>(key: K, value: Resume[K]) => setResume(current => current ? { ...current, [key]: value } : current);
  const hasContent = resumeHasContent(resume);
  function replaceDraft(next: Resume) {
    if (latestResume.current && resumeHasContent(latestResume.current) && !window.confirm("Replace this draft? Export a JSON backup first if you want to keep it.")) return false;
    setResume(next); setError(""); return true;
  }
  function download(content: string, extension: string, mime: string) {
    try {
      const url = URL.createObjectURL(new Blob([content], { type: mime }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${resumeFilename(resume!)}.${extension}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setError(""); setMessage(extension === "json" ? "JSON backup prepared. Keep this personal file somewhere safe." : "Text résumé prepared. Check your browser’s downloads.");
    } catch { setError("The download could not start. Check browser download permissions and try again."); }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    setError(""); setMessage(""); setBusy(true);
    try {
      if (file.size > RESUME_MAX_BYTES) throw new Error("Choose a résumé JSON backup up to 1 MB.");
      const next = readResumeBackup(await file.text());
      if (replaceDraft(next)) setMessage("Backup imported. Review the details and preview before exporting.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The backup could not be read. Your current draft is unchanged."); }
    finally { setBusy(false); if (importInput.current) importInput.current.value = ""; }
  }
  function printPdf() {
    if (!resume!.name.trim()) { setError("Add your full name before printing your résumé."); return; }
    setError(""); setMessage(""); printFrame.current?.remove();
    const frame = document.createElement("iframe");
    frame.title = "Print résumé"; frame.className = "resume-print-frame"; frame.setAttribute("sandbox", "allow-same-origin allow-modals"); frame.referrerPolicy = "no-referrer";
    frame.onload = () => {
      try {
        if (!frame.contentWindow) throw new Error("Print unavailable");
        frame.contentWindow.focus(); frame.contentWindow.print();
        setMessage("Print dialog requested. Choose Save as PDF, match the paper size, and turn off headers and footers. Review every page before saving.");
      } catch { setError("The print dialog could not open. Try a current desktop browser and allow printing, then try again."); }
    };
    frame.srcdoc = resumeDocument(resume!); printFrame.current = frame; document.body.appendChild(frame);
  }
  function renderSection(key: ResumeSectionKey) {
    if (key === "summary" || key === "skills" || key === "certifications") return <Field label={key === "summary" ? "Summary" : key === "skills" ? "Relevant skills" : "Certifications, awards & languages"} value={resume![key]} onChange={value => change(key, value)} multiline maxLength={6000} hint={key === "summary" ? "Write 2–4 sentences about your relevant experience and strengths. Tailor them to the role." : key === "skills" ? "Use a focused, comma-separated list. Match the job wording only where it reflects your actual skills." : "One item per line. Include issuer, date or proficiency where useful."} />;
    const entries = resume![key];
    return <>{entries.length === 0 && <p className="form-note">No entries yet. Empty sections are left out of the exported résumé.</p>}{entries.map((entry, index) => <EntryEditor key={entry.id} section={key} entry={entry} index={index} total={entries.length} update={next => change(key, entries.map(item => item.id === entry.id ? next : item))} move={direction => change(key, moveResumeItem(entries, index, direction))} remove={() => { if (!resumeEntryHasContent(entry) || window.confirm("Remove this entry from the draft?")) change(key, entries.filter(item => item.id !== entry.id)); }} />)}<button className="resume-control" type="button" disabled={entries.length >= RESUME_MAX_ENTRIES} onClick={() => change(key, [...entries, emptyResumeEntry()])}>+ Add {key === "experience" ? "experience" : key === "education" ? "education" : "project"}</button><p className="form-note">{entries.length} / {RESUME_MAX_ENTRIES} entries</p></>;
  }

  return <div className="resume-workspace">
    <div className="admin-heading"><div><p className="eyebrow">Career workspace · Free & local</p><h1>Résumé Generator</h1><p>Build a clear, considered résumé. Your experience, in your words.</p></div></div>
    <div className="resume-intro"><div><strong>A résumé that travels well.</strong><p>Two clean, single-column layouts with selectable text. Edit, preview and save a PDF using your browser—no credits or subscription.</p></div><Link href="/adminauth/documentation/#guide-resume-generator">Read the guide ↗</Link></div>
    <div className="resume-toolbar" aria-label="Résumé actions"><button className="resume-control" type="button" disabled={busy} onClick={() => { if (replaceDraft(resumeFromPublicProfile())) setMessage("Public profile loaded. Review dates, contact details and wording; this does not read saved Pages overrides or change the public site."); }}>Start from public profile</button><button className="resume-control" type="button" onClick={() => importInput.current?.click()} disabled={busy}>Import backup</button><button className="resume-control" type="button" onClick={() => download(JSON.stringify(resume, null, 2), "json", "application/json")}>Export JSON backup</button><button className="resume-control" type="button" disabled={!hasContent} onClick={() => download(resumeToText(resume), "txt", "text/plain;charset=utf-8")}>Download text</button><button className="resume-control resume-primary" type="button" onClick={printPdf}>Print / Save PDF</button><input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="Import résumé JSON backup" onChange={event => void importBackup(event.target.files?.[0])} /></div>
    <div className="resume-storage"><label className="resume-checkbox"><input type="checkbox" checked={saving} onChange={event => { if (!event.target.checked || window.confirm("Save this personal draft on this browser? It stays after logout. Enabling saving replaces any previous stored copy.")) toggleSaving(event.target.checked); }} />Remember draft on this browser</label><p role="status">{status}</p><p>Local drafts stay after logout and are not encrypted. Use a trusted device; export a backup to move between devices.</p>{conflict && <div className="resume-toolbar"><button className="resume-control" type="button" onClick={() => { if (window.confirm("Discard the edits in this tab and load the saved version?")) resolveConflict(true); }}>Load saved draft</button><button className="resume-control" type="button" onClick={() => { if (window.confirm("Replace the other tab’s saved draft with this version?")) resolveConflict(false); }}>Keep this version</button></div>}<button type="button" className="resume-clear" onClick={() => { if (window.confirm("Clear the entire draft from this tab and browser storage? Export a JSON backup first to keep a copy.")) { clearDraft(); setMessage(""); setError(""); } }}>Clear draft & local copy</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="admin-notice" role="status">{message}</p>}
    <div className="resume-layout"><div className="resume-editor">
      <section className="resume-panel"><div className="resume-panel-heading"><span className="resume-step">01</span><h2>Make it yours</h2></div><div className="resume-settings"><div><label htmlFor={`${settingsId}-layout`}>Layout</label><select id={`${settingsId}-layout`} value={resume.template} onChange={event => change("template", event.target.value as Resume["template"])}><option value="modern">Modern · clean sans serif</option><option value="classic">Classic · traditional serif</option></select></div><div><label htmlFor={`${settingsId}-paper`}>Paper</label><select id={`${settingsId}-paper`} value={resume.paper} onChange={event => change("paper", event.target.value as Resume["paper"])}><option value="a4">A4</option><option value="letter">US Letter</option></select></div><div><label htmlFor={`${settingsId}-spacing`}>Spacing</label><select id={`${settingsId}-spacing`} value={resume.spacing} onChange={event => change("spacing", event.target.value as Resume["spacing"])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div></div></section>
      <section className="resume-panel"><div className="resume-panel-heading"><span className="resume-step">02</span><h2>Personal details</h2></div><Field label="Full name" value={resume.name} onChange={value => change("name", value)} /><Field label="Professional headline" value={resume.headline} onChange={value => change("headline", value)} placeholder="WordPress / Full Stack Developer" /><div className="resume-field-row"><Field label="Email" value={resume.email} type="email" onChange={value => change("email", value)} /><Field label="Phone (optional)" value={resume.phone} type="tel" onChange={value => change("phone", value)} /></div><Field label="Location" value={resume.location} onChange={value => change("location", value)} hint="City and country are usually enough; a residential address is unnecessary." /><Field label="Website / portfolio" value={resume.website} onChange={value => change("website", value)} hint={resume.website && !safeResumeUrl(resume.website) ? "Use a full http(s) URL or a domain. Otherwise this appears as plain text." : undefined} /><Field label="LinkedIn URL (optional)" value={resume.linkedin} onChange={value => change("linkedin", value)} hint={resume.linkedin && !safeResumeUrl(resume.linkedin) ? "Use a full http(s) URL or a domain. Otherwise this appears as plain text." : undefined} /></section>
      <section className="resume-panel"><div className="resume-panel-heading"><span className="resume-step">03</span><h2>Tell your story</h2></div><p className="form-note">Move sections and entries with the arrows. Hide a section without deleting its contents.</p>{resume.order.map((key, index) => <details className="resume-section" key={key}><summary>{resumeSectionLabels[key]}<span>{resume.hidden.includes(key) ? "Hidden" : resumeSectionHasContent(resume, key) ? "Added" : "Empty"}</span></summary><div className="resume-section-body"><div className="resume-section-actions"><label className="resume-checkbox"><input type="checkbox" checked={!resume.hidden.includes(key)} onChange={event => change("hidden", event.target.checked ? resume.hidden.filter(item => item !== key) : [...resume.hidden, key])} />Include in résumé</label><div><button className="resume-control" type="button" disabled={index === 0} aria-label={`Move ${resumeSectionLabels[key]} section up`} onClick={() => change("order", moveResumeItem(resume.order, index, -1))}>↑</button><button className="resume-control" type="button" disabled={index === resume.order.length - 1} aria-label={`Move ${resumeSectionLabels[key]} section down`} onClick={() => change("order", moveResumeItem(resume.order, index, 1))}>↓</button></div></div>{renderSection(key)}</div></details>)}</section>
    </div><aside className="resume-preview-panel" aria-label="Résumé preview"><div className="resume-preview-heading"><div><p className="eyebrow">Live preview</p><h2>Your next chapter.</h2></div><span>{resume.paper === "a4" ? "A4" : "Letter"} · {resume.template}</span></div><ResumePreview resume={resume} /><div className="resume-export-note"><strong>Ready when you are.</strong><p>Choose <b>Print / Save PDF</b>, select <b>Save as PDF</b>, match the paper size and turn off browser headers and footers. Review page breaks in the print dialog.</p><p>The preview is a continuous sheet. Printing splits longer résumés into pages. Aim for 1–2 focused pages; text and layout are designed for straightforward reading, with no ATS scoring guarantee.</p></div></aside></div>
  </div>;
}
