"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { site } from "@/content/site";

export function InquiryForm() {
  const [topic, setTopic] = useState("Web development");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("topic") === "experience") {
      setTopic("Discuss relevant experience");
    }
  }, []);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const sending = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    for (const field of ["name", "email", "message"]) {
      const value = String(data.get(field) ?? "").trim();
      if (!value) { setError("Please enter your name, email, and message."); return; }
      data.set(field, value);
    }
    setError("");
    sending.current = true;
    setStatus("sending");
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const result = await submitInquiry(site.contactFormEndpoint, data, controller.signal);
      if (result.ok) {
        form.reset();
        setTopic("Web development");
        setStatus("success");
      } else {
        setError(result.message);
        setStatus("idle");
      }
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
      request.current = null;
    }
  }

  return <div id="inquiry" className="inquiry-panel">
    <h2>What would you like to build or improve?</h2>
    <p id="inquiry-help" className="body-copy">Include your website or design link, the work you need, and your preferred timeline. A budget range is helpful if you have one. Please leave out passwords and private client materials.</p>
    <form action={site.contactFormEndpoint} method="POST" onSubmit={send} aria-busy={status === "sending"} aria-describedby="inquiry-help inquiry-privacy" onChange={() => { setError(""); if (status === "success") setStatus("idle"); }}>
      <div hidden aria-hidden="true"><label>Leave this blank<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="inquiry-fields" disabled={status === "sending"}>
      <div className="form-row">
        <div><label htmlFor="inquiry-name">Your name <span>(required)</span></label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={100} /></div>
        <div><label htmlFor="inquiry-email">Email address <span>(required)</span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
      </div>
      <label htmlFor="inquiry-topic">What’s it about?</label>
      <select id="inquiry-topic" name="topic" value={topic} onChange={event => setTopic(event.target.value)}><option>Web development</option><option>Career opportunity</option><option>Discuss relevant experience</option><option>Lazy Barista</option><option>Golden Travel and Tours</option><option>Collaboration</option><option>General inquiry</option></select>
      <label htmlFor="inquiry-message">Your message <span>(required)</span></label>
      <textarea id="inquiry-message" name="message" rows={7} required maxLength={3000} placeholder="Website or design link:
What you need help with:
Preferred timeline:
Budget range (optional):" />
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send project inquiry"} <span aria-hidden="true">↗</span></button>
      <div className="inquiry-status" role="status" aria-live="polite" aria-atomic="true">{status === "success" ? "Thank you — your inquiry has been submitted. I’ll reply to the email address you provided." : status === "sending" ? "Sending your inquiry. Please keep this page open." : ""}</div>
      <p id="inquiry-privacy" className="form-note">Your name, email, and message are processed by <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">Formspree</a> to deliver your inquiry.</p>
      <p className="form-note">Having trouble sending? Email <a href={`mailto:${site.email}`}>{site.email}</a> directly.</p>
    </form>
  </div>;
}
