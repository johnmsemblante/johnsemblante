import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run these tests against the Firestore emulator. See docs/admin-setup.md. Never point them at production.');
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) throw new Error('Rules tests must use a loopback emulator.');
let environment;
const projectId = 'demo-portfolio-admin';
const article = (status = 'draft') => ({ slug: 'an-article', title: 'An article', excerpt: 'Intro', category: 'Notes', content: 'A paragraph\n\n## Heading', publishedAt: status === 'published' ? '2026-11-05' : '', status, revision: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const adminDb = () => environment.authenticatedContext('owner', { email_verified: true }).firestore();

before(async () => { environment = await initializeTestEnvironment({ projectId, firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') } }); });
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'admins', 'owner'), { enabled: true });
    await setDoc(doc(db, 'blogPosts', 'an-article'), article());
    await setDoc(doc(db, 'blogPosts', 'public-article'), { ...article('published'), slug: 'public-article' });
  });
});
after(async () => { await environment?.cleanup(); });

test('anonymous readers see published articles and cannot read drafts or list everything', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'blogPosts', 'public-article')));
  await assertFails(getDoc(doc(db, 'blogPosts', 'an-article')));
  await assertFails(getDocs(collection(db, 'blogPosts')));
  await assertSucceeds(getDocs(query(collection(db, 'blogPosts'), where('status', '==', 'published'))));
});
test('sign-in alone does not grant admin access; clients cannot approve themselves', async () => {
  const db = environment.authenticatedContext('stranger', { email_verified: true }).firestore();
  await assertFails(getDoc(doc(db, 'blogPosts', 'an-article')));
  await assertFails(setDoc(doc(db, 'blogPosts', 'new-article'), { ...article(), slug: 'new-article' }));
  await assertFails(setDoc(doc(db, 'admins', 'stranger'), { enabled: true }));
  await assertFails(getDoc(doc(db, 'admins', 'owner')));
  await assertFails(getDocs(collection(db, 'admins')));
  await assertSucceeds(getDoc(doc(db, 'admins', 'stranger')));
});
test('approved admins can create, edit, publish and unpublish with revision checks', async () => {
  const db = adminDb(); const ref = doc(db, 'blogPosts', 'new-article');
  await assertSucceeds(getDoc(doc(db, 'blogPosts', 'an-article')));
  await assertSucceeds(setDoc(ref, { ...article(), slug: 'new-article' }));
  await assertSucceeds(updateDoc(ref, { title: 'Updated', status: 'published', publishedAt: '2026-11-05', revision: 2, updatedAt: serverTimestamp() }));
  const publicDb = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(publicDb, 'blogPosts', 'new-article')));
  await assertSucceeds(updateDoc(ref, { status: 'draft', revision: 3, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(publicDb, 'blogPosts', 'new-article')));
  await assertFails(deleteDoc(ref));
});
test('rules reject malformed writes, forged timestamps and stale revisions', async () => {
  const db = adminDb(); const ref = doc(db, 'blogPosts', 'an-article');
  for (const changes of [{ title: ' ' }, { content: '' }, { content: 'x'.repeat(60001) }, { slug: 'different' }, { status: 'hidden' }, { privateNotes: 'must not leak' }, { updatedAt: Timestamp.fromMillis(0) }, { createdAt: Timestamp.fromMillis(0) }]) {
    await assertFails(updateDoc(ref, { revision: 2, updatedAt: serverTimestamp(), ...changes }));
  }
  await assertFails(updateDoc(ref, { title: 'Stale', revision: 1, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { title: 'Jump', revision: 3, updatedAt: serverTimestamp() }));
});
test('revocation takes effect and unverified accounts remain denied', async () => {
  const unverified = environment.authenticatedContext('owner', { email_verified: false }).firestore();
  await assertFails(getDoc(doc(unverified, 'blogPosts', 'an-article')));
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'admins', 'owner'), { enabled: false }));
  await assertFails(getDoc(doc(adminDb(), 'blogPosts', 'an-article')));
  await environment.withSecurityRulesDisabled(context => deleteDoc(doc(context.firestore(), 'admins', 'owner')));
  await assertFails(getDoc(doc(adminDb(), 'blogPosts', 'an-article')));
  await assertFails(setDoc(doc(adminDb(), 'admins', 'owner'), { enabled: true }));
});
test('future private collections stay inaccessible until explicitly implemented', async () => {
  await assertFails(getDoc(doc(adminDb(), 'privatePages', 'example')));
  await assertFails(setDoc(doc(adminDb(), 'privatePages', 'example'), { text: 'private' }));
});
