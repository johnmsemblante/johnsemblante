"use client";

import { PageText, PageLink } from "@/components/page-content";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitInquiry } from "@/lib/submit-inquiry";
import { site } from "@/content/site";

export function InquiryForm({ initialTopic = "Web development", initialMessage = "", travel = false, onSuccess }: { initialTopic?: string; initialMessage?: string; travel?: boolean; onSuccess?: () => void } = {}) {
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState(initialMessage);
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
        setTopic(initialTopic);
        setMessage("");
        setStatus("success");
        onSuccess?.();
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
    <h2><PageText scope="inquiry_form_1" fallback={travel ? "Request your final trip quotation" : "What would you like to build or improve?"} /></h2>
    <p id="inquiry-help" className="body-copy"><PageText scope="inquiry_form_2" fallback={travel ? "Review your itinerary, add your name and email, then send it to John for a confirmed quotation. This does not reserve a vehicle." : "Include your website or design link, the work you need, and your preferred timeline. A budget range is helpful if you have one. Please leave out passwords and private client materials."} /></p>
    <form action={site.contactFormEndpoint} method="POST" onSubmit={send} aria-busy={status === "sending"} aria-describedby="inquiry-help inquiry-privacy" onChange={() => { setError(""); if (status === "success") setStatus("idle"); }}>
      <div hidden aria-hidden="true"><label><PageText scope="inquiry_form_3" fallback={"Leave this blank"} /><input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" /></label></div>
      <fieldset className="inquiry-fields" disabled={status === "sending"}>
      <div className="form-row">
        <div><label htmlFor="inquiry-name"><PageText scope="inquiry_form_4" fallback={"Your name "} /><span><PageText scope="inquiry_form_5" fallback={"(required)"} /></span></label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={100} /></div>
        <div><label htmlFor="inquiry-email"><PageText scope="inquiry_form_6" fallback={"Email address "} /><span><PageText scope="inquiry_form_7" fallback={"(required)"} /></span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
      </div>
      <label htmlFor="inquiry-topic"><PageText scope="inquiry_form_8" fallback={"What’s it about?"} /></label>
      <select id="inquiry-topic" name="topic" value={topic} onChange={event => setTopic(event.target.value)}><option><PageText scope="inquiry_form_9" fallback={"Web development"} /></option><option><PageText scope="inquiry_form_10" fallback={"Career opportunity"} /></option><option><PageText scope="inquiry_form_11" fallback={"Discuss relevant experience"} /></option><option><PageText scope="inquiry_form_12" fallback={"Lazy Barista"} /></option><option><PageText scope="inquiry_form_13" fallback={"Golden Travel and Tours"} /></option><option><PageText scope="inquiry_form_14" fallback={"Collaboration"} /></option><option><PageText scope="inquiry_form_15" fallback={"General inquiry"} /></option></select>
      <label htmlFor="inquiry-message"><PageText scope="inquiry_form_16" fallback={"Your message "} /><span><PageText scope="inquiry_form_17" fallback={"(required)"} /></span></label>
      <textarea id="inquiry-message" name="message" value={message} onChange={event => setMessage(event.target.value)} rows={7} required maxLength={6000} placeholder="Website or design link:
What you need help with:
Preferred timeline:
Budget range (optional):" />
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button" type="submit" disabled={status === "sending"}><PageText scope="inquiry_form_18" fallback={status === "sending" ? "Sending…" : travel ? "Send trip inquiry" : "Send project inquiry"} /> <span aria-hidden="true">↗</span></button>
      <div className="inquiry-status" role="status" aria-live="polite" aria-atomic="true"><PageText scope="inquiry_form_19" fallback={status === "success" ? "Thank you! Your inquiry has been submitted. I’ll reply to the email address you provided. The form is ready for a new inquiry." : status === "sending" ? "Sending your inquiry. Please keep this page open." : ""} /></div>
      <p id="inquiry-privacy" className="form-note"><PageText scope="inquiry_form_20" fallback={"Your name, email, and message are processed by "} /><PageLink scope="inquiry_form_21" href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer"><PageText scope="inquiry_form_22" fallback={"Formspree"} /></PageLink> <PageText scope="inquiry_form_23" fallback={"to deliver your inquiry."} /></p>
      <p className="form-note"><PageText scope="inquiry_form_24" fallback={"Having trouble sending? Email "} /><PageLink scope="inquiry_form_25" href={`mailto:${site.email}`}><PageText scope="inquiry_form_26" fallback={site.email} /></PageLink> <PageText scope="inquiry_form_27" fallback={"directly."} /></p>
    </form>
  </div>;
}
