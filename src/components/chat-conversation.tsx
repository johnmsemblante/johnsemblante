"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Firestore } from "firebase/firestore";
import { CHAT_MESSAGE_LIMIT, CHAT_PAGE_SIZE, sendChatMessage, watchMessages, type ChatContact, type ChatMessage } from "@/lib/chat-store";
import styles from "./chat.module.css";

export function ChatConversation({ db, uid, sender, exists, contact, active = true }: {
  db: Firestore; uid: string; sender: ChatMessage["sender"]; exists: boolean; contact?: ChatContact; active?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [count, setCount] = useState(CHAT_PAGE_SIZE);
  const [retry, setRetry] = useState(0);
  const [readError, setReadError] = useState(false);
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [nextSend, setNextSend] = useState(0);
  const [cooldownReady, setCooldownReady] = useState(true);
  const history = useRef<HTMLOListElement>(null);
  const scrollToLatest = useRef(true);
  const sendHint = useId();
  const canSend = !sending && cooldownReady && Boolean(draft.trim()) && (exists || Boolean(contact));

  useEffect(() => {
    if (!exists || !active) return;
    return watchMessages(db, uid, count, items => {
      setMessages(items);
      setLoaded(true);
      setReadError(false);
    }, () => setReadError(true));
  }, [db, uid, count, exists, active, retry]);

  const latest = messages[0]?.id;
  useEffect(() => {
    if (active && scrollToLatest.current && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [latest, active]);

  useEffect(() => {
    if (!nextSend) return;
    const timer = window.setTimeout(() => setCooldownReady(true), Math.max(0, nextSend - Date.now()));
    return () => window.clearTimeout(timer);
  }, [nextSend]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    if (!navigator.onLine) {
      setSendError("You’re offline. Reconnect to send your message.");
      return;
    }
    setSending(true);
    setSendError("");
    scrollToLatest.current = true;
    try {
      await sendChatMessage(db, uid, sender, draft.trim(), exists ? undefined : contact);
      setDraft("");
      if (sender === "visitor") {
        setCooldownReady(false);
        setNextSend(Date.now() + 2100);
      }
    } catch {
      setSendError("Your message couldn’t be sent. Wait a moment, then try again.");
    } finally {
      setSending(false);
    }
  }

  function sendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey
      || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    event.preventDefault();
    if (canSend && !event.repeat) event.currentTarget.form?.requestSubmit();
  }

  return <>
    {exists && !loaded && !readError && <p role="status">Loading messages…</p>}
    {readError && <p role="alert">Couldn’t load messages. <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
    {messages.length > count && <button type="button" onClick={() => {
      scrollToLatest.current = false;
      setCount(value => value + CHAT_PAGE_SIZE);
    }}>Load older messages</button>}
    <ol ref={history} className={styles.history} aria-label="Conversation" aria-live="polite" onScroll={event => {
      const list = event.currentTarget;
      scrollToLatest.current = list.scrollHeight - list.scrollTop - list.clientHeight < 48;
    }}>
      {messages.slice(0, count).reverse().map(message => <li key={message.id} data-own={message.sender === sender}>
        <small>{message.sender === sender ? "You" : sender === "visitor" ? "John" : "Visitor"}</small>
        <p>{message.body}</p>
      </li>)}
    </ol>
    <form className={styles.form} onSubmit={submit}>
      <label>{sender === "admin" ? "Reply" : "Message"}
        <textarea required rows={2} maxLength={CHAT_MESSAGE_LIMIT} value={draft} readOnly={sending} aria-describedby={sendHint}
          onKeyDown={sendOnEnter} onChange={event => setDraft(event.target.value)} />
      </label>
      <small id={sendHint}>Enter to send. Shift+Enter for a new line.</small>
      {sendError && <p role="alert">{sendError}</p>}
      {sending && <span role="status">Waiting for delivery confirmation…</span>}
      <button type="submit" disabled={!canSend}>{sender === "admin" ? "Send reply" : "Send message"}</button>
    </form>
  </>;
}
