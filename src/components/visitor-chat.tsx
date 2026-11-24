"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { signInAnonymously } from "firebase/auth";
import { firebaseConfigured, getVisitorFirebase } from "@/lib/firebase-client";
import { PRESENCE_EXPIRY_MS, watchAvailability, watchVisitorThread, type ChatContact } from "@/lib/chat-store";
import { ChatConversation } from "./chat-conversation";
import styles from "./chat.module.css";

export function VisitorChat() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<{ db: ReturnType<typeof getVisitorFirebase>["db"]; uid: string }>();
  const [exists, setExists] = useState<boolean>();
  const [contact, setContact] = useState<ChatContact>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [available, setAvailable] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const starting = useRef<Promise<NonNullable<typeof session>> | undefined>(undefined);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open, contact]);

  useEffect(() => {
    if (!open || session) return;
    let live = true;
    starting.current ??= (async () => {
      const { auth, db } = getVisitorFirebase();
      await auth.authStateReady();
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      return { db, uid: user.uid };
    })();
    starting.current.then(value => {
      if (live) setSession(value);
    }).catch(() => {
      starting.current = undefined;
      if (live) setError(true);
    });
    return () => { live = false; };
  }, [open, session, retry]);

  useEffect(() => {
    if (!open || !session) return;
    const stopThread = watchVisitorThread(session.db, session.uid, value => {
      setExists(value);
      setError(false);
    }, () => setError(true));
    let timer: number | undefined;
    const stopAvailability = watchAvailability(session.db, stamp => {
      window.clearTimeout(timer);
      const remaining = Math.min(PRESENCE_EXPIRY_MS, stamp + PRESENCE_EXPIRY_MS - Date.now());
      setAvailable(remaining > 0);
      if (remaining > 0) timer = window.setTimeout(() => setAvailable(false), remaining);
    }, () => setAvailable(false));
    return () => {
      stopThread();
      stopAvailability();
      window.clearTimeout(timer);
    };
  }, [open, session, retry]);

  const close = useCallback(() => {
    setOpen(false);
    setAvailable(false);
    launcher.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const focused = document.activeElement;
      if (focused === document.body || widget.current?.contains(focused)) close();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, close]);

  function continueToChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name")).trim();
    if (!name) {
      const input = event.currentTarget.elements.namedItem("name") as HTMLInputElement;
      input.setCustomValidity("Enter your name.");
      input.reportValidity();
      return;
    }
    setContact({ name, email: String(fields.get("email")).trim(), phone: String(fields.get("phone")).trim() });
  }

  if (!firebaseConfigured) return null;

  return <div className={styles.widget} ref={widget}>
    <section id="portfolio-chat" aria-labelledby="portfolio-chat-title" className={styles.panel} hidden={!open}>
      <header>
        <h2 id="portfolio-chat-title" ref={heading} tabIndex={-1}>Chat with John</h2>
        <button type="button" onClick={close} aria-label="Close chat">Close</button>
      </header>
      {!error && <p role="status">{available ? "Available for live chat" : "Leave a message and John can follow up."}</p>}
      {error && <p role="alert">Chat couldn’t connect. <button type="button" onClick={() => { setError(false); setRetry(value => value + 1); }}>Retry</button> or <Link href="/contact/">use the contact form</Link>.</p>}
      {!error && exists === undefined && <p role="status">Connecting…</p>}
      {exists === false && !contact && <form onSubmit={continueToChat} className={styles.form}>
        <label>Name<input name="name" autoComplete="name" required maxLength={80} onInput={event => event.currentTarget.setCustomValidity("")} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
        <p>John will receive your contact details when you send your first message.</p>
        <button type="submit">Continue to chat</button>
      </form>}
      {session && (exists || contact) && <ChatConversation db={session.db} uid={session.uid} sender="visitor" exists={Boolean(exists)} contact={contact} active={open} />}
    </section>
    <button ref={launcher} type="button" className={styles.launcher} aria-controls="portfolio-chat" aria-expanded={open}
      onClick={() => open ? close() : setOpen(true)}>Chat</button>
  </div>;
}
