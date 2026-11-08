import { after, before, beforeEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocFromServer, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run against the loopback Firestore emulator, never production. See docs/admin-setup.md.');
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
if (!['127.0.0.1', 'localhost'].includes(host)) throw new Error('Rules tests require a loopback emulator.');
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } }).outputText;
const modelUrl = moduleUrl(compile('src/lib/blog-model.ts'));
const { emptyPost, editablePost, postFromData } = await import(modelUrl);
const storeSource = compile('src/lib/blog-store.ts').replace('"firebase/firestore"', JSON.stringify(import.meta.resolve('firebase/firestore'))).replace('"./blog-model"', JSON.stringify(modelUrl));
const { saveManagedPost, deleteManagedPost } = await import(moduleUrl(storeSource));
const readerSource = compile('src/lib/public-blog-store.ts').replace('"firebase/firestore"', JSON.stringify(import.meta.resolve('firebase/firestore'))).replace('"./blog-model"', JSON.stringify(modelUrl));
const { readPublicArticle } = await import(moduleUrl(readerSource));
const industriesUrl = moduleUrl(compile('src/content/industries.ts'));
const workModelUrl = moduleUrl(compile('src/lib/work-model.ts').replace('"@/content/industries"', JSON.stringify(industriesUrl)));
const { mergeWorks } = await import(workModelUrl);
const workStoreUrl = moduleUrl(compile('src/lib/work-store.ts').replace('"firebase/firestore"', JSON.stringify(import.meta.resolve('firebase/firestore'))).replace('"./work-model"', JSON.stringify(workModelUrl)));
const { writeWork } = await import(workStoreUrl);
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
  for (const patch of [{ status: 'scheduled', publishedAt: Timestamp.fromMillis(Date.now() - 1000) }, { title: ' ' }, { categories: [] }, { tags: ['duplicate', 'duplicate'] }, { tags: [5] }, { tags: ['x'.repeat(81)] }, { seoTitle: 'x'.repeat(161) }, { privateNotes: 'not allowed' }, { content: 'x'.repeat(60001) }, { updatedAt: Timestamp.fromMillis(0) }, { revision: 1 }]) await assertFails(updateDoc(ref, { revision: 2, updatedAt: serverTimestamp(), ...patch })).catch(cause => { throw new Error('Invalid patch accepted: '+JSON.stringify(patch), { cause }); });
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


test('publishing supports the full category and tag limits with a featured image', async () => {
  const db = adminDb();
  for (const [categories, tags] of [[1,0], [2,5], [5,10], [10,20]]) {
    const input = { ...emptyPost(), title: 'Publishing labels ' + categories + '-' + tags, excerpt: 'Intro', content: 'Body', status: 'published', categories: Array.from({length: categories}, (_,i)=>'Category '+i), tags: Array.from({length: tags},(_,i)=>'Tag '+i), featuredImage: 'https://images.unsplash.com/photo-test.jpg', featuredImageAlt: 'Test image' };
    const saved = await saveManagedPost(db, input, null, []).catch(cause => { throw new Error('Publish failed at '+categories+' categories / '+tags+' tags', { cause }); });
    assert.equal(saved.tags.length, tags);
    const edited = await saveManagedPost(db, { ...input, excerpt: 'Updated intro' }, saved, []);
    assert.equal(edited.categories.length, categories);
  }
});


test('label validation rejects malformed entries at every position and preserves boundaries', async () => {
  const db = adminDb(); const ref = doc(db, 'blogPosts', 'an-article');
  for (const invalid of ['', ' ', '\t\n', 5, true, null, { label: 'nested' }, 'x'.repeat(81), 'a'.repeat(60)+'\u0000'+'b'.repeat(60)]) {
    for (const index of [0, 9, 19]) {
      const tags = Array.from({length: 20}, (_, i) => 'Tag '+i); tags[index] = invalid;
      await assertFails(updateDoc(ref, { tags, revision: 2, updatedAt: serverTimestamp() }));
    }
  }
  await assertFails(updateDoc(ref, { tags: Array.from({length:21},(_,i)=>'Tag '+i), revision:2, updatedAt:serverTimestamp() }));
  await assertFails(updateDoc(ref, { categories: Array.from({length:11},(_,i)=>'Category '+i), category:'Category 0', revision:2, updatedAt:serverTimestamp() }));
  const categories = Array.from({length:10},(_,i)=>('Category '+i).padEnd(80,'x'));
  const tags = Array.from({length:20},(_,i)=>('Tag '+i).padEnd(80,'x'));
  tags[0] = 'Cebu\nPhilippines'; tags[1] = 'Caf? / ???';
  await assertSucceeds(updateDoc(ref, { categories, category:categories[0], tags, revision:2, updatedAt:serverTimestamp() }));
});

const workProject = (publication='draft') => ({slug:'sample-work',title:'Sample work',summary:'A real project summary',role:'Developer',industries:['other'],technologies:['WordPress'],projectType:'client',publication,status:'live'});
async function workBatch(db,project,revision=1){const batch=writeBatch(db);batch.set(doc(db,'managedWorks',project.slug),{project,revision,updatedAt:serverTimestamp()});batch.set(doc(db,'publicWorks',project.slug),project.publication==='published'?{slug:project.slug,deleted:false,project}:{slug:project.slug,deleted:true});return batch.commit();}
test('Works drafts remain private and publication uses a matching atomic public projection',async()=>{const db=adminDb(),anon=environment.unauthenticatedContext().firestore();await assertSucceeds(workBatch(db,workProject()));await assertFails(getDoc(doc(anon,'managedWorks','sample-work')));assert.deepEqual((await getDoc(doc(anon,'publicWorks','sample-work'))).data(),{slug:'sample-work',deleted:true});await assertSucceeds(workBatch(db,workProject('published'),2));assert.equal((await getDoc(doc(anon,'publicWorks','sample-work'))).data().project.title,'Sample work');await assertSucceeds(workBatch(db,workProject('draft'),3));assert.equal((await getDoc(doc(anon,'publicWorks','sample-work'))).data().deleted,true);});
test('Works reject unapproved writes, mismatched public records and stale revisions',async()=>{const anon=environment.unauthenticatedContext().firestore();await assertFails(workBatch(anon,workProject('published')));const db=adminDb();await assertSucceeds(workBatch(db,workProject('published')));await assertFails(workBatch(db,workProject('published'),1));await assertFails(setDoc(doc(db,'publicWorks','sample-work'),{slug:'sample-work',deleted:false,project:{...workProject('published'),title:'Forged'}}));await assertFails(setDoc(doc(db,'managedWorks','sample-work'),{project:workProject('draft'),revision:2,updatedAt:serverTimestamp()}));});
test('Works deletion leaves a tombstone so source projects do not reappear',async()=>{const db=adminDb();await assertSucceeds(workBatch(db,workProject('published')));await assertFails(deleteDoc(doc(db,'managedWorks','sample-work')));const batch=writeBatch(db);batch.delete(doc(db,'managedWorks','sample-work'));batch.set(doc(db,'publicWorks','sample-work'),{slug:'sample-work',deleted:true});await assertSucceeds(batch.commit());assert.equal((await getDoc(doc(environment.unauthenticatedContext().firestore(),'publicWorks','sample-work'))).data().deleted,true);});
test('Works validates URLs and full label lists while keeping publication within rule limits',async()=>{const db=adminDb();await assertFails(workBatch(db,{...workProject('published'),website:'javascript:alert(1)'}));const labels=Array.from({length:20},(_,i)=>'Entry '+i);await assertSucceeds(workBatch(db,{...workProject('published'),technologies:labels,tags:labels,capabilities:labels,objectives:labels,features:labels,contributions:labels}));});

test('blog rename preserves timestamps, content and privacy across published, draft and scheduled posts', async () => {
  const db = adminDb();
  for (const status of ['published', 'draft', 'scheduled']) {
    const schedule = new Date(Date.now() + 86400000).toISOString().slice(0,16);
    const original = await saveManagedPost(db, { ...emptyPost(), title: 'Rename ' + status, excerpt: 'Intro', content: '## Keep this content', status, scheduledFor: schedule, tags: ['Keep'], featuredImage: '/images/keep.webp' }, null, []);
    const oldData = (await getDocFromServer(doc(db,'blogPosts',original.slug))).data();
    const moved = await saveManagedPost(db, { ...editablePost(original), title: 'New title' }, original, [], {slug: original.slug + '-new'});
    const newData = (await getDocFromServer(doc(db,'blogPosts',moved.slug))).data();
    assert.equal((await getDocFromServer(doc(db,'blogPosts',original.slug))).exists(), false);
    assert.ok(oldData.createdAt.isEqual(newData.createdAt));
    assert.equal(moved.publishedAt, original.publishedAt);
    assert.equal(moved.content, original.content); assert.equal(moved.featuredImage, original.featuredImage);
    assert.equal(newData.releaseAt, oldData.releaseAt);
    assert.equal(moved.revision,1);
    const anonRef=doc(environment.unauthenticatedContext().firestore(),'blogPosts',moved.slug);
    if(status==='published')await assertSucceeds(getDocFromServer(anonRef));else await assertFails(getDocFromServer(anonRef));
    const edited = await saveManagedPost(db, { ...editablePost(moved), excerpt: 'Still editable' }, moved, []);
    assert.equal(edited.revision,2);
    await assert.rejects(saveManagedPost(db, editablePost(original), original, [], {slug:'stale-'+status}), /revision-conflict/);
  }
});

test('blog explicit slugs reject collisions, reserved source URLs and invalid values without losing either record', async () => {
  const db=adminDb();const original=postFromData('public-article',(await getDocFromServer(doc(db,'blogPosts','public-article'))).data());
  for(const slug of ['an-article','reserved-source']) {
    await assert.rejects(saveManagedPost(db,editablePost(original),original,['reserved-source'],{slug}),/slug-in-use/);
    assert.equal((await getDocFromServer(doc(db,'blogPosts',original.slug))).data().revision,original.revision);
  }
  for(const slug of ['','UPPER','with spaces','../bad','double--dash','x'.repeat(101)]) await assert.rejects(saveManagedPost(db,editablePost(original),original,[],{slug}),/URL slug/);
  const custom=await saveManagedPost(db,{...emptyPost(),title:'A different title',excerpt:'Intro',content:'Body'},null,[],{slug:'chosen-slug'});
  assert.equal(custom.slug,'chosen-slug');
  await assert.rejects(saveManagedPost(db,editablePost(custom),null,[],{slug:'chosen-slug'}),/slug-in-use/);
});

test('blog rename rules require deleting a real source atomically and forbid forged timestamp inheritance', async () => {
  const db=adminDb();const old=(await getDocFromServer(doc(db,'blogPosts','public-article'))).data();
  const moved={...old,slug:'renamed-post',renamedFrom:'public-article',revision:1,updatedAt:serverTimestamp()};
  await assertFails(setDoc(doc(db,'blogPosts','renamed-post'),moved));
  for(const patch of [{renamedFrom:'missing'}, {createdAt:Timestamp.fromMillis(0)}, {publishedAt:Timestamp.fromMillis(0)}]) {
    const batch=writeBatch(db);batch.set(doc(db,'blogPosts','renamed-post'),{...moved,...patch});batch.delete(doc(db,'blogPosts','public-article'));await assertFails(batch.commit());
  }
  const legacy=postFromData('legacy',(await getDocFromServer(doc(db,'blogPosts','legacy'))).data());
  const renamedLegacy=await saveManagedPost(db,editablePost(legacy),legacy,[],{slug:'legacy-renamed'});
  assert.equal(renamedLegacy.publishedAt,legacy.publishedAt);
});

test('Works rename moves managed/public records and hides a renamed source baseline', async () => {
  const db=adminDb(),source=workProject('published');
  const first=await writeWork(db,source,null);
  const moved=await writeWork(db,{...source,slug:'managed-renamed'},first.revision,false,{originalSlug:source.slug});
  assert.equal(moved.revision,1);
  assert.equal((await getDocFromServer(doc(db,'managedWorks',source.slug))).exists(),false);
  assert.deepEqual((await getDocFromServer(doc(db,'publicWorks',source.slug))).data(),{slug:source.slug,deleted:true});
  assert.equal((await getDocFromServer(doc(db,'publicWorks',moved.project.slug))).data().project.slug,'managed-renamed');
  const sourceOnly={...source,slug:'source-only',image:{src:'/images/original.webp',alt:'Original screenshot'}};
  await writeWork(db,{...sourceOnly,slug:'source-renamed'},null,false,{originalSlug:sourceOnly.slug,reservedSlugs:[sourceOnly.slug]});
  const publicRecords=(await getDocs(collection(db,'publicWorks'))).docs.map(d=>d.data());
  const merged=mergeWorks([source,sourceOnly],publicRecords);
  assert.deepEqual(merged.map(p=>p.slug).sort(),['managed-renamed','source-renamed']);
  assert.equal(merged.find(p=>p.slug==='source-renamed').image.src,sourceOnly.image.src);
  await assert.rejects(writeWork(db,{...source,slug:'stale'},first.revision,false,{originalSlug:source.slug}),/changed in another tab/);
});

test('Works rename rejects occupied, reserved and deleted slugs and keeps drafts private', async () => {
  const db=adminDb(),source=workProject();const saved=await writeWork(db,source,null);
  await writeWork(db,{...source,slug:'taken'},null);
  await writeWork(db,{...source,slug:'deleted'},null,true);
  for(const slug of ['taken','deleted','source-reserved']) await assert.rejects(writeWork(db,{...source,slug},saved.revision,false,{originalSlug:source.slug,reservedSlugs:['source-reserved']}),/already/);
  const moved=await writeWork(db,{...source,slug:'private-new'},saved.revision,false,{originalSlug:source.slug});
  const publicData=(await getDocFromServer(doc(environment.unauthenticatedContext().firestore(),'publicWorks',moved.project.slug))).data();
  assert.deepEqual(publicData,{slug:'private-new',deleted:true});
  await assertFails(getDocFromServer(doc(environment.unauthenticatedContext().firestore(),'managedWorks',moved.project.slug)));
  await assert.rejects(writeWork(db,{...source,slug:'industry'},null,false,{originalSlug:null}),/reserved/);
});

test('renaming supports the full label limits for published blog posts and Works', async () => {
  const db=adminDb();
  const labels=Array.from({length:20},(_,i)=>('Entry '+i).padEnd(80,'x'));
  const original=await saveManagedPost(db,{...emptyPost(),title:'Many labels',excerpt:'Intro',content:'Body',status:'published',categories:labels.slice(0,10),tags:labels},null,[]);
  const moved=await saveManagedPost(db,editablePost(original),original,[],{slug:'many-labels-renamed'});
  assert.equal(moved.tags.length,20);assert.equal(moved.publishedAt,original.publishedAt);
  const project={...workProject('published'),technologies:labels,tags:labels,capabilities:labels,objectives:labels,features:labels,contributions:labels};
  const work=await writeWork(db,project,null);
  const renamed=await writeWork(db,{...project,slug:'many-work-labels'},work.revision,false,{originalSlug:project.slug});
  assert.equal(renamed.project.contributions.length,20);
});
