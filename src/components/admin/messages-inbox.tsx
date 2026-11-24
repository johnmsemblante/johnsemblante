"use client";

import { useEffect, useRef, useState } from "react";
import { getFirebase } from "@/lib/firebase-client";
import { CHAT_PAGE_SIZE, PRESENCE_REFRESH_MS, setChatAvailability, watchInbox, type ChatThread } from "@/lib/chat-store";
import { ChatConversation } from "../chat-conversation";
import styles from "../chat.module.css";

export function MessagesInbox() {
  const [threads, setThreads] = useState<ChatThread[]>();
  const [selected, setSelected] = useState("");
  const [count, setCount] = useState(CHAT_PAGE_SIZE);
  const [retry, setRetry] = useState(0);
  const [inboxError, setInboxError] = useState(false);
  const [available, setAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [presenceError, setPresenceError] = useState("");
  const refreshing = useRef(false);

  useEffect(() => {
    return watchInbox(getFirebase().db, count, items => {
      setThreads(items);
      setInboxError(false);
    }, () => setInboxError(true));
  }, [count, retry]);

  useEffect(() => {
    if (!available) return;
    let active = true;
    async function refresh() {
      if (!navigator.onLine || document.hidden || refreshing.current) return;
      refreshing.current = true;
      try {
        await setChatAvailability(getFirebase().db, true);
      } catch {
        if (active) {
          setAvailable(false);
          setPresenceError("Availability couldn’t be refreshed. Turn it on again to resume live chat.");
        }
      } finally {
        refreshing.current = false;
      }
    }
    const timer = window.setInterval(refresh, PRESENCE_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [available]);

  async function toggleAvailability() {
    if (!navigator.onLine) {
      setPresenceError("Reconnect to change your availability.");
      return;
    }
    const next = !available;
    setUpdating(true);
    setPresenceError("");
    if (!next) setAvailable(false);
    try {
      await setChatAvailability(getFirebase().db, next);
      setAvailable(next);
    } catch {
      setPresenceError("Couldn’t update availability. The last online status expires automatically.");
    } finally {
      setUpdating(false);
    }
  }

  const thread = threads?.find(item => item.id === selected);

  return <div className={styles.inbox}>
    <header>
      <h1>Messages</h1>
      <p>Reply here while a visitor is chatting, or use their email to follow up after they leave.</p>
      <button type="button" aria-pressed={available} disabled={updating} onClick={toggleAvailability}>Available for chat</button>
      <p role="status">{updating ? "Updating availability…" : available ? "Availability is on while this inbox stays open and active." : "Availability is off for this tab. Visitors can still leave messages."}</p>
      {presenceError && <p role="alert">{presenceError}</p>}
    </header>
    {inboxError && <p role="alert">Couldn’t load the inbox. <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
    {!threads && !inboxError && <p role="status">Loading conversations…</p>}
    {threads?.length === 0 && <p>No conversations yet.</p>}
    {Boolean(threads?.length) && <div className={styles.inboxGrid}>
      <div>
        <ul className={styles.threadList} aria-label="Conversations">
          {threads?.slice(0, count).map(item => <li key={item.id}>
            <button type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
              <strong>{item.name}</strong>
              <small>{item.needsReply ? "Needs reply" : "Replied"}{item.updatedAt ? ` · ${item.updatedAt.toDate().toLocaleString()}` : ""}</small>
            </button>
          </li>)}
        </ul>
        {threads && threads.length > count && <button type="button" onClick={() => setCount(value => value + CHAT_PAGE_SIZE)}>Load more conversations</button>}
      </div>
      {thread ? <section aria-labelledby="selected-chat">
        <h2 id="selected-chat">{thread.name}</h2>
        <p><a href={`mailto:${encodeURIComponent(thread.email).replace("%40", "@")}`}>{thread.email}</a>{thread.phone && <> · {thread.phone}</>}</p>
        <ChatConversation key={thread.id} db={getFirebase().db} uid={thread.id} sender="admin" exists />
      </section> : <p>Select a conversation to read and reply.</p>}
    </div>}
  </div>;
}
