"use client";

import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch, type Firestore, type Timestamp } from "firebase/firestore";

export type ChatContact = { name: string; email: string; phone: string };
export type ChatThread = ChatContact & { id: string; needsReply: boolean; updatedAt: Timestamp };
export type ChatMessage = { id: string; body: string; sender: "visitor" | "admin"; sentAt: Timestamp };
type OnError = (error: Error) => void;

export const CHAT_PAGE_SIZE = 30;
export const CHAT_MESSAGE_LIMIT = 2000;
export const PRESENCE_REFRESH_MS = 30_000;
export const PRESENCE_EXPIRY_MS = 90_000;
const threadRef = (db: Firestore, uid: string) => doc(db, "chatThreads", uid);
const presenceRef = (db: Firestore) => doc(db, "chatPublic", "availability");

export function watchVisitorThread(db: Firestore, uid: string, receive: (exists: boolean) => void, fail: OnError) {
  return onSnapshot(threadRef(db, uid), { includeMetadataChanges: true }, snapshot => {
    if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) receive(snapshot.exists());
  }, fail);
}

export function watchInbox(db: Firestore, count: number, receive: (threads: ChatThread[]) => void, fail: OnError) {
  const threads = query(collection(db, "chatThreads"), orderBy("updatedAt", "desc"), limit(count + 1));
  return onSnapshot(threads, { includeMetadataChanges: true }, snapshot => {
    if (!snapshot.metadata.hasPendingWrites) receive(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as ChatThread)));
  }, fail);
}

export function watchMessages(db: Firestore, uid: string, count: number, receive: (messages: ChatMessage[]) => void, fail: OnError) {
  const messages = query(collection(threadRef(db, uid), "messages"), orderBy("sentAt", "desc"), limit(count + 1));
  return onSnapshot(messages, snapshot => receive(snapshot.docs
    .filter(item => !item.metadata.hasPendingWrites)
    .map(item => ({ ...item.data(), id: item.id } as ChatMessage))), fail);
}

export async function sendChatMessage(db: Firestore, uid: string, sender: ChatMessage["sender"], body: string, contact?: ChatContact) {
  const thread = threadRef(db, uid);
  const message = doc(collection(thread, "messages"));
  const batch = writeBatch(db);
  const activity = {
    lastMessageId: message.id,
    needsReply: sender === "visitor",
    updatedAt: serverTimestamp(),
    ...(sender === "visitor" ? { lastVisitorAt: serverTimestamp() } : {}),
  };
  if (contact) batch.set(thread, { ...contact, ...activity });
  else batch.update(thread, activity);
  batch.set(message, { body, sender, sentAt: serverTimestamp() });
  await batch.commit();
}

export function watchAvailability(db: Firestore, receive: (lastAvailable: number) => void, fail: OnError) {
  return onSnapshot(presenceRef(db), { includeMetadataChanges: true }, snapshot => {
    const data = snapshot.data();
    receive(!snapshot.metadata.fromCache && data?.available ? data.updatedAt?.toMillis() ?? 0 : 0);
  }, fail);
}

export function setChatAvailability(db: Firestore, available: boolean) {
  return setDoc(presenceRef(db), { available, updatedAt: serverTimestamp() });
}
