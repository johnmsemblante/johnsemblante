"use client";

import { useRef, useState } from "react";
import { normalizeLabels } from "@/lib/blog-model";

export function TokenInput({ id, label, values, maximum, onChange }: {
  id: string; label: string; values: string[]; maximum: number; onChange: (values: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function add(value = text) {
    const labels = normalizeLabels([...values, ...value.split(",")]);
    if (labels.length > maximum || labels.some(item => item.length > 80)) {
      const message = `Use up to ${maximum} labels, each up to 80 characters.`;
      setError(message); input.current?.setCustomValidity(message); return;
    }
    onChange(labels); setText(""); setError(""); input.current?.setCustomValidity("");
  }
  return <div className="token-field">
    <label htmlFor={id}>{label}</label>
    <ul className="editor-tokens" aria-label={`Selected ${label.toLowerCase()}`}>{values.map(value => <li key={value.toLowerCase()}><span>{value}</span><button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter(item => item !== value))}>×</button></li>)}</ul>
    <div className="token-add"><input ref={input} id={id} value={text} maxLength={600} placeholder={`Add ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={`${id}-help`} onChange={event => { setText(event.target.value); setError(""); input.current?.setCustomValidity(""); }} onBlur={() => { if (text.trim()) add(); }} onKeyDown={event => {
      if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); }
      if (event.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
    }} /><button type="button" onClick={() => add()}>Add</button></div>
    <p id={`${id}-help`} className="form-note">Press Enter or comma to add. Up to {maximum} labels.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
