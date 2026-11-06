"use client";

import { useRef, useState } from "react";
import { normalizeLabels } from "@/lib/blog-model";

export function TokenInput({ id, label, values, maximum, onChange }: {
  id: string; label: string; values: string[]; maximum: number; onChange: (values: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function add(value = text, remainder = "") {
    const labels = normalizeLabels([...values, ...value.split(",")]);
    if (labels.length > maximum || labels.some(item => item.length > 80)) {
      const message = `Use up to ${maximum} labels, each up to 80 characters.`;
      setText(value + remainder); setError(message); input.current?.setCustomValidity(message); return;
    }
    onChange(labels); setText(remainder); setError(""); input.current?.setCustomValidity("");
  }
  return <div className="token-field">
    <label htmlFor={id}>{label}</label>
    <ul className="editor-tokens" aria-label={`Selected ${label.toLowerCase()}`}>{values.map(value => <li key={value.toLowerCase()}><span>{value}</span><button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter(item => item !== value))}>×</button></li>)}</ul>
    <div className="token-add"><input ref={input} id={id} value={text} maxLength={1700} placeholder={`Add ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={`${id}-help`} onChange={event => {
      const value = event.target.value;
      setText(value); setError(""); input.current?.setCustomValidity("");
      if (!(event.nativeEvent as InputEvent).isComposing && value.includes(",")) {
        const separator = value.lastIndexOf(",");
        add(value.slice(0, separator + 1), value.slice(separator + 1));
      }
    }} onPaste={event => {
      const pasted = event.clipboardData.getData("text");
      if (!pasted.includes(",")) return;
      event.preventDefault();
      const element = event.currentTarget;
      add(text.slice(0, element.selectionStart ?? text.length) + pasted + text.slice(element.selectionEnd ?? text.length));
    }} onCompositionEnd={event => {
      const value = event.currentTarget.value;
      if (value.includes(",")) { const separator = value.lastIndexOf(","); add(value.slice(0, separator + 1), value.slice(separator + 1)); }
    }} onBlur={() => { if (text.trim()) add(); }} onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter") { event.preventDefault(); add(); }
      if (event.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
    }} /><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => add()}>Add</button></div>
    <p id={`${id}-help`} className="form-note">Type a comma or paste a comma-separated list to add automatically. Enter or Add also works. Up to {maximum} labels.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}
