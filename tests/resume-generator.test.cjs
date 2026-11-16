const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exported = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => dependencies[name] ?? require(name), exported);
  return exported;
}
const model = load('src/lib/resume-model.ts');
const document = load('src/lib/resume-document.ts', { './resume-model': model });
const navigation = load('src/lib/admin-navigation.ts');
const entry = (overrides = {}) => ({ id: 'entry-1', title: 'Developer', organization: 'Example', location: 'Cebu', dates: '2023 – Present', url: '', highlights: 'Built accessible interfaces.\n• Maintained websites.\n\n- Reviewed code.', ...overrides });
const resume = () => ({ ...model.emptyResume(), name: 'María Dela Cruz', headline: 'Web Developer', email: 'owner@example.test', summary: 'Experienced developer.', experience: [entry()], education: [entry({ title: 'Degree' })], skills: 'HTML, CSS, JavaScript' });

test('versioned JSON backups round-trip all content, Unicode, hidden sections and layout without accepting extra fields', () => {
  const draft = { ...resume(), template: 'classic', paper: 'letter', spacing: 'compact', hidden: ['education'], order: [...model.resumeSectionKeys].reverse() };
  assert.deepEqual(model.readResumeBackup(JSON.stringify(draft)), draft);
  assert.deepEqual(model.parseResume({ ...draft, unexpectedPrivateField: 'discard me' }), draft);
  assert.notEqual(model.emptyResume().order, model.emptyResume().order);
  assert.notEqual(model.resumeStorageKey('one'), model.resumeStorageKey('two'));
});

test('unrelated, corrupt, oversized and malformed backups are rejected before replacement', () => {
  for (const value of [null, [], {}, { version: 2 }, { ...resume(), name: null }, { ...resume(), summary: 'x'.repeat(6001) }, { ...resume(), name: 'x'.repeat(301) }, { ...resume(), name: 'bad\u0000text' }, { ...resume(), order: ['summary'] }, { ...resume(), order: Array(6).fill('summary') }, { ...resume(), hidden: ['unknown'] }, { ...resume(), hidden: ['skills', 'skills'] }, { ...resume(), template: 'external' }, { ...resume(), paper: 'a0' }, { ...resume(), spacing: 'tiny' }, { ...resume(), experience: Array(21).fill(entry()) }, { ...resume(), projects: [entry(), entry()] }, { ...resume(), education: [entry({ id: '' })] }, { ...resume(), experience: [entry({ highlights: [] })] }]) assert.throws(() => model.parseResume(value));
  assert.throws(() => model.readResumeBackup('{not-json}'), /not valid JSON/);
  assert.throws(() => model.readResumeBackup('é'.repeat(model.RESUME_MAX_BYTES / 2 + 1)), /up to 1 MB/);
  const many = { ...resume(), projects: Array.from({ length: 20 }, (_, index) => entry({ id: String(index) })) };
  assert.equal(model.parseResume(many).projects.length, 20);
});

test('text export respects visibility and order, omits blank sections and preserves readable bullet text', () => {
  const draft = { ...resume(), hidden: ['education'], order: ['skills', 'summary', 'experience', 'projects', 'education', 'certifications'], projects: [entry({ title: '', organization: '', location: '', dates: '', highlights: '' })] };
  const text = model.resumeToText(draft);
  assert.ok(text.startsWith('María Dela Cruz\nWeb Developer\nowner@example.test'));
  assert.ok(text.indexOf('SKILLS') < text.indexOf('PROFESSIONAL SUMMARY'));
  assert.ok(!text.includes('EDUCATION') && !text.includes('SELECTED PROJECTS'));
  assert.ok(text.includes('• Maintained websites.\n• Reviewed code.'));
  assert.equal(model.resumeFilename(draft), 'María-Dela-Cruz-resume');
  assert.equal(model.resumeFilename({ ...draft, name: ' ../<>:"/\\|?* ' }), 'my-resume');
});

test('reordering never mutates the original and boundary moves keep content intact', () => {
  const input = ['first', 'second', 'third'];
  assert.deepEqual(model.moveResumeItem(input, 1, -1), ['second', 'first', 'third']);
  assert.deepEqual(model.moveResumeItem(input, 1, 1), ['first', 'third', 'second']);
  for (const [index, direction] of [[0, -1], [2, 1], [-1, 1], [5, -1]]) assert.deepEqual(model.moveResumeItem(input, index, direction), input);
  assert.deepEqual(input, ['first', 'second', 'third']);
});

test('contact-only drafts still count as work for replacement prompts and unload warnings', () => {
  assert.equal(model.resumeHasContent(model.emptyResume()), false);
  for (const key of ['name', 'headline', 'email', 'phone', 'location', 'website', 'linkedin', 'summary', 'skills', 'certifications']) assert.equal(model.resumeHasContent({ ...model.emptyResume(), [key]: 'Something worth keeping' }), true);
  assert.equal(model.resumeHasContent({ ...model.emptyResume(), experience: [entry()] }), true);
});

test('HTML export escapes hostile content everywhere and has no executable or remote resources', () => {
  const payload = '</title><script>alert(1)</script><img src="https://evil.test/pixel" onerror="alert(2)">';
  const draft = { ...resume(), name: payload, headline: payload, summary: payload, skills: payload, email: payload, certifications: payload, website: 'javascript:alert(1)', experience: [entry({ title: payload, organization: payload, dates: payload, location: payload, highlights: payload, url: 'https://example.test/?q="<svg onload=x>' })] };
  const html = document.resumeDocument(draft);
  assert.ok(!/<script|<img|<svg|onerror="|href="javascript:/i.test(html));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes("default-src 'none'; style-src 'unsafe-inline'"));
  assert.ok(!html.includes('@import') && !html.includes('<link') && !html.includes('<iframe'));
  assert.ok(html.includes('javascript:alert(1)'));
});

test('links allow normal web URLs only and keep unsafe values out of href attributes', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'https://name:password@example.test/', '//evil.test', 'https://example.test/a b', 'file:///private/file', 'https://example.test/"<svg>']) assert.equal(document.safeResumeUrl(value), null, value);
  assert.equal(document.safeResumeUrl('example.test/portfolio'), 'https://example.test/portfolio');
  assert.equal(document.safeResumeUrl('https://example.test/?q=a&b=2'), 'https://example.test/?q=a&b=2');
  const html = document.resumeDocument({ ...resume(), website: 'https://example.test/?a=1&b=2' });
  assert.ok(html.includes('href="https://example.test/?a=1&amp;b=2"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test('both print templates use semantic selectable content, matching paper and the same visibility/order as text', () => {
  for (const template of ['modern', 'classic']) for (const paper of ['a4', 'letter']) {
    const draft = { ...resume(), template, paper, hidden: ['education'] };
    const html = document.resumeDocument(draft);
    assert.ok(html.includes(`<h1>María Dela Cruz</h1>`));
    assert.ok(html.includes('<li>Built accessible interfaces.</li>'));
    assert.ok(!html.includes('<h2>Education</h2>') && !html.includes('<h2>Selected projects</h2>'));
    assert.ok(html.includes(`@page{size:${paper === 'a4' ? 'A4' : 'Letter'}`));
    assert.ok(html.includes('@media print') && html.includes('break-after:avoid'));
    assert.ok(!html.includes('<canvas') && !html.includes('<img'));
  }
});

test('public profile starter copies existing public facts and degree only, without invented data or site mutations', () => {
  const profile = load('src/content/profile.ts');
  const publicProfile = structuredClone(profile.profile);
  const { resumeFromPublicProfile } = load('src/lib/resume-profile.ts', { './resume-model': model, '@/content/profile': profile, '@/content/site': { site: { email: 'public@example.test', url: 'https://example.test' } } });
  const draft = model.parseResume(resumeFromPublicProfile());
  assert.equal(draft.name, profile.profile.fullName);
  assert.equal(draft.experience.length, profile.profile.experience.length);
  assert.equal(draft.experience[0].highlights, profile.profile.experience[0].responsibilities.join('\n'));
  assert.equal(draft.education.length, 1); assert.match(draft.education[0].title, /^Bachelor/);
  assert.equal(draft.phone, ''); assert.equal(draft.projects.length, 0);
  draft.experience[0].title = 'Changed locally';
  assert.deepEqual(profile.profile, publicProfile);
});

test('resume destination inherits the existing admin boundary and is excluded from the public sitemap', () => {
  assert.equal(navigation.safeAdminDestination('/adminauth/resume'), '/adminauth/resume/');
  assert.equal(navigation.adminLinks.filter(link => link.href === '/adminauth/resume/').length, 1);
  assert.ok(navigation.activeAdminLink('/adminauth/resume/', '/adminauth/resume/'));
  assert.ok(fs.existsSync('src/app/adminauth/resume/page.tsx'));
  assert.ok(fs.readFileSync('src/components/admin/admin-home.tsx', 'utf8').includes('/adminauth/resume/'));
  assert.ok(fs.readFileSync('src/app/adminauth/layout.tsx', 'utf8').includes('<AdminGate>'));
  assert.ok(!fs.readFileSync('src/app/sitemap.ts', 'utf8').includes('/adminauth/resume'));
});
