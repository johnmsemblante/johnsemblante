"use client";

import { useEffect, useState, type FormEvent } from "react";
import { site } from "@/content/site";

export function InquiryForm() {
  const [topic, setTopic] = useState("Web development");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("topic") === "experience") {
      setTopic("Discuss relevant experience");
    }
  }, []);
  const [error, setError] = useState("");

  function validate(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    if (!["name", "email", "message"].every(key => String(data.get(key) ?? "").trim())) {
      event.preventDefault();
      setError("Please enter your name, email, and message.");
    }
  }

  return <div id="inquiry" className="inquiry-panel">
    <h2>Tell me what you have in mind.</h2>
    <p id="inquiry-help" className="body-copy">Have an idea or a question? Send your message here and I’ll reply by email.</p>
    <form action={`https://formsubmit.co/${site.email}`} method="POST" onSubmit={validate} aria-describedby="inquiry-help inquiry-privacy" onChange={() => setError("")}>
      <input type="hidden" name="_subject" value="New website inquiry — John Semblante" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_captcha" value="true" />
      <input type="hidden" name="_url" value={`${site.url}/contact/`} />
      <div hidden aria-hidden="true"><label>Leave this blank<input type="text" name="_honey" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-row">
        <div><label htmlFor="inquiry-name">Your name <span>(required)</span></label><input id="inquiry-name" name="name" autoComplete="name" required maxLength={100} /></div>
        <div><label htmlFor="inquiry-email">Email address <span>(required)</span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
      </div>
      <label htmlFor="inquiry-topic">What’s it about?</label>
      <select id="inquiry-topic" name="topic" value={topic} onChange={event => setTopic(event.target.value)}><option>Web development</option><option>Career opportunity</option><option>Discuss relevant experience</option><option>Lazy Barista</option><option>Golden Travel and Tours</option><option>Collaboration</option><option>General inquiry</option></select>
      <label htmlFor="inquiry-message">Your message <span>(required)</span></label>
      <textarea id="inquiry-message" name="message" rows={7} required maxLength={3000} placeholder="A little about your idea, what you need, and any timing you have in mind." />
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button" type="submit">Send inquiry <span aria-hidden="true">↗</span></button>
      <p id="inquiry-privacy" className="form-note">Your name, email, and message are processed by <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit</a> and forwarded to me. You may be asked to complete a spam check before sending.</p>
      <p className="form-note">Having trouble sending? Email <a href={`mailto:${site.email}`}>{site.email}</a> directly.</p>
    </form>
  </div>;
}
