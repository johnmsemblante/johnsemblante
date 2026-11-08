const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exported = {};
  new Function('require', 'exports', code)(name => name in dependencies ? dependencies[name] : ['react', 'react/jsx-runtime'].includes(name) ? require(name) : {}, exported);
  return exported;
}
const navigation = load('src/lib/admin-navigation.ts');
const link = { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };

test('login return destinations are limited to known admin routes', () => {
  assert.equal(navigation.safeAdminDestination('/adminauth/jobs'), '/adminauth/jobs/');
  assert.equal(navigation.safeAdminDestination('/adminauth/blog/'), '/adminauth/blog/');
  for (const target of ['https://evil.example', '//evil.example', 'javascript:alert(1)', '/adminauth/../other', '/adminauth/jobs/?redirect=evil', null]) assert.equal(navigation.safeAdminDestination(target), null);
});
test('shared shell exposes both apps, one active navigation item and an accessible mobile toggle', () => {
  const icons = load('src/components/admin/admin-icon.tsx');
  const { DashboardShell } = load('src/components/admin/dashboard-shell.tsx', { 'next/link': link, 'next/navigation': { usePathname: () => '/adminauth/jobs' }, '@/lib/admin-navigation': navigation, './admin-icon': icons });
  const html = renderToStaticMarkup(React.createElement(DashboardShell, { name: 'Admin', email: 'owner@example.com', busy: false, error: '', logout: async () => {} }, 'Selected app'));
  for (const text of ['Dashboard', 'Overview', 'Blog', 'Works', 'Job Finder', 'Logout', 'Selected app']) assert.ok(html.includes(text));
  const active = html.match(/<a[^>]*aria-current="page"[^>]*>/g) || [];
  assert.equal(active.length, 1); assert.ok(active[0].includes('/adminauth/jobs/'));
  assert.ok(html.includes('aria-expanded="false"')); assert.ok(html.includes('aria-controls='));
  assert.ok(html.includes('data-admin-signout="true"'));
});
test('the shared authorization gate never server-renders private children before access is verified', () => {
  const { AdminGate } = load('src/components/admin/admin-gate.tsx', { 'next/link': link, 'next/navigation': { usePathname: () => '/adminauth/jobs', useRouter: () => ({ replace() { throw new Error('No redirect during server render'); } }) }, '@/lib/firebase-client': { firebaseConfigured: true }, '@/lib/admin-navigation': navigation });
  const html = renderToStaticMarkup(React.createElement(AdminGate, null, 'PRIVATE CONTENT MUST NOT RENDER'));
  assert.ok(!html.includes('PRIVATE CONTENT MUST NOT RENDER'));
  assert.ok(html.includes('role="status"'));
});
