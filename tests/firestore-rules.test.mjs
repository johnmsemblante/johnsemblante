import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocFromServer, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run against the loopback Firestore emulator, never production. See docs/admin-setup.md.');
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
if (!['127.0.0.1', 'localhost'].includes(host)) throw new Error('Rules tests require a loopback emulator.');
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } }).outputText;
const modelUrl = moduleUrl(compile('src/lib/blog-model.ts'));
const { emptyPost } = await import(modelUrl);
const storeSource = compile('src/lib/blog-store.ts').replace('"firebase/firestore"', JSON.stringify(import.meta.resolve('firebase/firestore'))).replace('"./blog-model"', JSON.stringify(modelUrl));
const { saveManagedPost, deleteManagedPost } = await import(moduleUrl(storeSource));
const readerSource = compile('src/lib/public-blog-store.ts').replace('"firebase/firestore"', JSON.stringify(import.meta.resolve('firebase/firestore'))).replace('"./blog-model"', JSON.stringify(modelUrl));
const { readPublicArticle } = await import(moduleUrl(readerSource));
let environment;
const article = (status = 'draft') => ({ schemaVersion: 2, slug: 'an-article', title: 'An article', excerpt: 'Intro', category: 'Notes', categories: ['Notes'], tags: ['Firebase'], content: 'A paragraph\n\n## Heading', seoTitle: '', seoDescription: '', status, publishedAt: status === 'published' ? serverTimestamp() : null, releaseAt: 0, revision: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const adminDb = () => environment.authenticatedContext('owner', { email_verified: true }).firestore();
before(async () => { environment = await initializeTestEnvironment({ projectId: 'demo-portfolio-admin', firestore: { host, port: Number(port), rules: readFileSync('firestore.rules', 'utf8') } }); });
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'admins', 'owner'), { enabled: true });
    await setDoc(doc(db, 'blogPosts', 'an-article'), article());
    await setDoc(doc(db, 'blogPosts', 'public-article'), { ...article('published'), slug: 'public-article' });
    await setDoc(doc(db, 'blogPosts', 'legacy'), { slug: 'legacy', title: 'Legacy post', excerpt: 'Old', category: 'Notes', content: 'Text', status: 'published', publishedAt: '2026-11-05', revision: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
});
after(async () => { await environment?.cleanup(); });

test('anonymous reads allow published/legacy posts and deny drafts, admin records and unfiltered lists', async () => {
  const db = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, 'blogPosts', 'public-article')));
  await assertSucceeds(getDoc(doc(db, 'blogPosts', 'legacy')));
  await assertFails(getDoc(doc(db, 'blogPosts', 'an-article')));
  await assertFails(getDoc(doc(db, 'admins', 'owner')));
  await assertFails(getDocs(collection(db, 'blogPosts')));
  await assertSucceeds(getDocs(query(collection(db, 'blogPosts'), where('status', '==', 'published'), orderBy('publishedAt', 'desc'))));
});
test('only enabled, verified admins can write or delete; clients cannot approve themselves', async () => {
  for (const db of [environment.unauthenticatedContext().firestore(), environment.authenticatedContext('other', { email_verified: true }).firestore(), environment.authenticatedContext('owner', { email_verified: false }).firestore()]) {
    await assertFails(setDoc(doc(db, 'blogPosts', 'new'), { ...article(), slug: 'new' }));
    await assertFails(deleteDoc(doc(db, 'blogPosts', 'public-article')));
    await assertFails(setDoc(doc(db, 'admins', 'other'), { enabled: true }));
  }
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'admins', 'owner'), { enabled: false }));
  await assertFails(getDoc(doc(adminDb(), 'blogPosts', 'an-article')));
});
test('automatic slugs handle collisions; publishing uses server time and editing preserves it', async () => {
  const db = adminDb(); const input = { ...emptyPost(), slug: 'wrong', title: 'Café travel', excerpt: 'An intro', content: 'A paragraph' };
  const first = await saveManagedPost(db, input, null, ['cafe-travel']);
  const second = await saveManagedPost(db, input, null, ['cafe-travel']);
  if (first.slug !== 'cafe-travel-2' || second.slug !== 'cafe-travel-3') throw new Error('Slug collisions were not resolved');
  const published = await saveManagedPost(db, { ...input, status: 'published' }, first, []);
  const before = (await getDocFromServer(doc(db, 'blogPosts', first.slug))).data().publishedAt;
  const edited = await saveManagedPost(db, { ...input, title: 'Changed title', status: 'published', categories: ['Notes', 'Travel'], tags: ['Cebu', 'Tips'], seoTitle: 'SEO title' }, published, []);
  const after = (await getDocFromServer(doc(db, 'blogPosts', first.slug))).data().publishedAt;
  if (!before.isEqual(after) || edited.slug !== first.slug || !edited.publishedAt) throw new Error('Published timestamp/slug changed');
  await assert.rejects(saveManagedPost(db, input, first, []), /revision-conflict/);
  await assertSucceeds(deleteManagedPost(db, edited));
  await assertFails(getDocFromServer(doc(environment.unauthenticatedContext().firestore(), 'blogPosts', first.slug)));
});
test('future schedules are private and become readable after server time passes without another write', async () => {
  const db = adminDb(); const release = Date.now() + 4000;
  const ref = doc(db, 'blogPosts', 'scheduled');
  await assertSucceeds(setDoc(ref, { ...article(), slug: 'scheduled', status: 'scheduled', publishedAt: Timestamp.fromMillis(release), releaseAt: release }));
  const publicDb = environment.unauthenticatedContext().firestore();
  await assertFails(getDocFromServer(doc(publicDb, 'blogPosts', 'scheduled')));
  assert.equal(await readPublicArticle(publicDb, 'scheduled', Date.now(), `http://${host}:${port}/v1`), null);
  await assertFails(getDocs(query(collection(publicDb, 'blogPosts'), where('status', '==', 'scheduled'))));
  await assertFails(getDocs(query(collection(publicDb, 'blogPosts'), where('status', '==', 'scheduled'), where('releaseAt', '<=', release + 60000))));
  await assertSucceeds(getDocs(query(collection(publicDb, 'blogPosts'), where('status', '==', 'scheduled'), where('releaseAt', '>=', 0), where('releaseAt', '<=', Date.now() - 1000), orderBy('releaseAt', 'desc'))));
  await new Promise(resolve => setTimeout(resolve, Math.max(0, release - Date.now() + 1500)));
  assert.equal((await readPublicArticle(publicDb, 'scheduled', Date.now(), `http://${host}:${port}/v1`))?.slug, 'scheduled');
  const afterReleaseDb = environment.unauthenticatedContext().firestore();
  await assertSucceeds(getDocs(query(collection(afterReleaseDb, 'blogPosts'), where('status', '==', 'scheduled'), where('releaseAt', '>=', 0), where('releaseAt', '<=', Date.now() - 1000), orderBy('releaseAt', 'desc')))).catch(error => { throw new Error('After-release query failed: ' + error.message); });
  await assertSucceeds(getDocFromServer(doc(afterReleaseDb, 'blogPosts', 'scheduled'))).catch(error => { throw new Error('After-release document failed: ' + error.message); });
  const snapshot = await getDocFromServer(ref);
  if (snapshot.data().status !== 'scheduled' || snapshot.data().revision !== 1) throw new Error('Schedule required a status-changing write');
});
test('rules reject past schedules, forged publish times, malformed labels/SEO, extra fields and stale revisions', async () => {
  const db = adminDb(); const ref = doc(db, 'blogPosts', 'an-article');
  for (const patch of [{ status: 'scheduled', publishedAt: Timestamp.fromMillis(Date.now() - 1000) }, { title: ' ' }, { categories: [] }, { tags: ['duplicate', 'duplicate'] }, { tags: [5] }, { tags: ['x'.repeat(81)] }, { seoTitle: 'x'.repeat(161) }, { privateNotes: 'not allowed' }, { content: 'x'.repeat(60001) }, { updatedAt: Timestamp.fromMillis(0) }, { revision: 1 }]) await assertFails(updateDoc(ref, { revision: 2, updatedAt: serverTimestamp(), ...patch }));
  await assertFails(setDoc(doc(db, 'blogPosts', 'forged'), { ...article('published'), slug: 'forged', publishedAt: Timestamp.fromMillis(Date.now() - 60000) }));
  await assertFails(setDoc(doc(db, 'blogPosts', 'future-public'), { ...article('published'), slug: 'future-public', publishedAt: Timestamp.fromMillis(Date.now() + 60000) }));
});
test('existing legacy articles upgrade when edited; unpublishing and deletion remain private', async () => {
  const db = adminDb();
  const { postFromData } = await import(modelUrl);
  const old = postFromData('legacy', (await getDocFromServer(doc(db, 'blogPosts', 'legacy'))).data());
  const updated = await saveManagedPost(db, { ...emptyPost(), slug: old.slug, title: old.title, excerpt: old.excerpt, content: old.content, status: 'published' }, old, []);
  if (updated.schemaVersion !== 2 || updated.publishedAt !== old.publishedAt) throw new Error('Legacy migration lost publication date');
  const draft = await saveManagedPost(db, { ...emptyPost(), slug: updated.slug, title: updated.title, excerpt: updated.excerpt, content: updated.content }, updated, []);
  await assertFails(getDocFromServer(doc(environment.unauthenticatedContext().firestore(), 'blogPosts', 'legacy')));
  await assertSucceeds(deleteManagedPost(db, draft));
});

const savedJob = () => ({ sourceId: 'engineer-123', source: 'Arbeitnow', title: 'Engineer', company: 'Example company', location: 'Berlin', remote: true, url: 'https://www.arbeitnow.com/jobs/companies/example/engineer-123', postedAt: 1760000000000, savedAt: serverTimestamp() });
test('approved admins can save, list and remove their own job bookmarks', async () => {
  const db = adminDb(); const ref = doc(db, 'admins', 'owner', 'savedJobs', 'engineer-123');
  await assertSucceeds(setDoc(ref, savedJob()));
  await assertSucceeds(getDocFromServer(ref));
  await assertSucceeds(getDocs(query(collection(db, 'admins', 'owner', 'savedJobs'), orderBy('savedAt', 'desc'))));
  await assertSucceeds(deleteDoc(ref));
});

test('Jobicy bookmarks preserve optional pay and summary fields with provider-matched URLs', async () => {
  const db = adminDb(); const ref = doc(db, 'admins', 'owner', 'savedJobs', 'jobicy-123');
  const job = { ...savedJob(), sourceId: 'jobicy-123', source: 'Jobicy', location: 'Philippines', url: 'https://jobicy.com/jobs/123-developer', summary: 'WordPress developer', salary: 'USD 2,000 / monthly', employment: 'Contract' };
  await assertSucceeds(setDoc(ref, job));
  await assertSucceeds(getDocFromServer(ref));
  for (const patch of [{ url: 'https://www.arbeitnow.com/jobs/123' }, { url: 'https://jobicy.com.evil/jobs/123' }, { remote: false }, { salary: 2000 }, { summary: 'x'.repeat(701) }, { employment: ['Contract'] }, { sourceId: 'different' }]) await assertFails(setDoc(ref, { ...job, ...patch }));
  await assertSucceeds(deleteDoc(ref));
});

test('Himalayas bookmarks require their provider URL and retain timezone and expiration metadata', async () => {
  const db = adminDb(); const id = 'himalayas-7-example-wordpress-developer'; const ref = doc(db, 'admins', 'owner', 'savedJobs', id);
  const job = { ...savedJob(), sourceId: id, source: 'Himalayas', location: 'Philippines', url: 'https://himalayas.app/companies/example/jobs/wordpress-developer?utm_source=api', timezone: 'UTC+8 included in source restrictions', expiresAt: 8640000000000 };
  await assertSucceeds(setDoc(ref, job)); await assertSucceeds(getDocFromServer(ref));
  for (const patch of [{ url: 'https://jobicy.com/jobs/123' }, { url: 'https://himalayas.app.evil/companies/example/jobs/wordpress-developer' }, { timezone: 'x'.repeat(121) }, { expiresAt: 'tomorrow' }, { remote: false }]) await assertFails(setDoc(ref, { ...job, ...patch }));
  await assertSucceeds(deleteDoc(ref));
});
test('saved jobs are private even from other approved administrators', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'admins', 'other'), { enabled: true });
    await setDoc(doc(context.firestore(), 'admins', 'owner', 'savedJobs', 'engineer-123'), savedJob());
  });
  for (const db of [environment.unauthenticatedContext().firestore(), environment.authenticatedContext('other', { email_verified: true }).firestore(), environment.authenticatedContext('owner', { email_verified: false }).firestore()]) {
    const ref = doc(db, 'admins', 'owner', 'savedJobs', 'engineer-123');
    await assertFails(getDocFromServer(ref)); await assertFails(setDoc(ref, savedJob())); await assertFails(deleteDoc(ref));
    await assertFails(getDocs(collection(db, 'admins', 'owner', 'savedJobs')));
  }
});
test('saved jobs reject unsafe URLs, extra fields and forged timestamps; revocation closes access', async () => {
  const db = adminDb(); const ref = doc(db, 'admins', 'owner', 'savedJobs', 'engineer-123');
  for (const patch of [{ sourceId: 'different' }, { source: 'Other provider' }, { url: 'javascript:alert(1)' }, { url: 'https://evil.example/jobs/123' }, { description: '<script>not allowed</script>' }, { remote: 'hybrid' }, { savedAt: Timestamp.fromMillis(0) }]) await assertFails(setDoc(ref, { ...savedJob(), ...patch }));
  await assertSucceeds(setDoc(ref, savedJob()));
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'admins', 'owner'), { enabled: false }));
  await assertFails(getDocFromServer(ref)); await assertFails(deleteDoc(ref));
});


test('featured image fields are optional, validated, and persist through editor saves', async () => {
  const db = adminDb();
  const input = { ...emptyPost(), title: 'Image post', excerpt: 'Intro', content: 'Body', featuredImage: 'https://example.com/cover.webp', featuredImageAlt: 'Cover description' };
  const saved = await saveManagedPost(db, input, null, []);
  assert.equal(saved.featuredImage, input.featuredImage);
  assert.equal(saved.featuredImageAlt, input.featuredImageAlt);
  const edited = await saveManagedPost(db, { ...input, featuredImage: '/images/cover.webp' }, saved, []);
  assert.equal(edited.featuredImage, '/images/cover.webp');
  const removed = await saveManagedPost(db, { ...input, featuredImage: '', featuredImageAlt: '' }, edited, []);
  assert.equal(removed.featuredImage, '');
  for (const patch of [{ featuredImage: 'javascript:bad' }, { featuredImage: '//evil.example/a' }, { featuredImage: 'http://example.com/a' }, { featuredImage: 42 }, { featuredImage: 'x'.repeat(2001) }, { featuredImageAlt: 'x'.repeat(201) }]) {
    await assertFails(updateDoc(doc(db, 'blogPosts', saved.slug), { ...patch, revision: removed.revision + 1, updatedAt: serverTimestamp() }));
  }
});
