"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";

export function InquiryForm() {
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const topic = String(data.get("topic") || "General inquiry");
    const message = String(data.get("message") || "").trim();
    if (!name || !email || !message) { setError("Please enter your name, email, and message."); return; }
    setError("");
    setCopyStatus("");
    setDraft({ subject: `${topic} — ${name}`, body: `Hi John,\n\n${message}\n\nFrom: ${name}\nReply to: ${email}\nTopic: ${topic}` });
  }
  async function copyDraft() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(`To: ${site.email}\nSubject: ${draft.subject}\n\n${draft.body}`); setCopyStatus("Inquiry copied. Paste it into your email app to send."); }
    catch { setCopyStatus("Copy is unavailable here. Select the draft text below and copy it manually."); }
  }
  return <div className="inquiry-panel"><h2>Tell me what you have in mind.</h2><p id="inquiry-help" className="body-copy">Fill in the form to prepare an email. You’ll review and send it from your email app.</p>
    <form action={`mailto:${site.email}`} method="post" encType="text/plain" onSubmit={prepare} aria-describedby="inquiry-help" onChange={() => { setDraft(null); setError(""); setCopyStatus(""); }}>
      <div className="form-row"><div><label htmlFor="inquiry-name">Your name <span>(required)</span></label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={100} /></div><div><label htmlFor="inquiry-email">Email address <span>(required)</span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div></div>
      <label htmlFor="inquiry-topic">What’s it about?</label><select id="inquiry-topic" name="topic" defaultValue="Web development"><option>Web development</option><option>Career opportunity</option><option>Lazy Barista</option><option>Golden Travel and Tours</option><option>Collaboration</option><option>General inquiry</option></select>
      <label htmlFor="inquiry-message">Your message <span>(required)</span></label><textarea id="inquiry-message" name="message" rows={7} required maxLength={3000} placeholder="A little about your idea, what you need, and any timing you have in mind." />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button" type="submit">Review inquiry <span aria-hidden="true">↗</span></button><p className="form-note">This website doesn’t store your message. Nothing is sent until you send the email yourself.</p>
    </form>
    {draft && <section className="inquiry-draft" aria-label="Your inquiry draft"><p role="status">Your draft is ready. It has not been sent.</p><p><strong>To:</strong> {site.email}<br /><strong>Subject:</strong> {draft.subject}</p><pre>{draft.body}</pre><div className="actions"><a className="button" href={`mailto:${site.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>Open email app ↗</a><button className="button secondary" type="button" onClick={copyDraft}>Copy inquiry</button></div><p className="form-note">If no email app opens, copy the inquiry and send it to {site.email}.</p><p role="status">{copyStatus}</p></section>}
  </div>;
}
