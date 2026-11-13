const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');

// Exercise the actual gate and its event handlers without Google sign-in or
// production database writes. Firebase boundaries are controlled callbacks.
function gate({ path = '/adminauth/', search = '', popup = async () => {}, logout = async () => {} } = {}) {
  let cursor = 0, tree, authChanged, authFailed, accessChanged, accessFailed;
  let authStops = 0, accessStops = 0;
  const values = [], effects = [], cleanup = [], redirects = [], reloads = [];
  const previousWindow = global.window;
  global.window = { location: { search, replace: value => reloads.push(value) } };
  const hooks = {
    ...React,
    useState(initial) {
      const i = cursor++;
      if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial;
      return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value; }];
    },
    useEffect(fn, deps) {
      const i = cursor++, old = values[i];
      if (!old || deps.some((dep, index) => dep !== old[index])) {
        values[i] = deps;
        effects.push(() => { cleanup[i]?.(); cleanup[i] = fn(); });
      }
    },
  };
  const router = { replace: value => redirects.push(value) }, auth = {}, db = {};
  function Shell() {}
  class Provider { setCustomParameters(value) { this.parameters = value; } }
  const dependencies = {
    react: hooks,
    'next/link': { default: 'a' },
    'next/navigation': { usePathname: () => path, useRouter: () => router },
    'firebase/auth': {
      GoogleAuthProvider: Provider,
      onAuthStateChanged: (_, next, error) => { authChanged = next; authFailed = error; return () => authStops++; },
      signInWithPopup: async (client, provider) => { assert.equal(client, auth); assert.deepEqual(provider.parameters, { prompt: 'select_account' }); return popup(); },
      signOut: async client => { assert.equal(client, auth); return logout(); },
    },
    'firebase/firestore': {
      doc: (client, collection, uid) => { assert.equal(client, db); assert.equal(collection, 'admins'); return uid; },
      onSnapshot: (_, options, next, error) => { assert.equal(options.includeMetadataChanges, true); accessChanged = next; accessFailed = error; return () => accessStops++; },
    },
    '@/lib/firebase-client': { firebaseConfigured: true, getAdminAuth: () => auth, getFirebase: () => ({ db }), firebaseMessage: error => error.message },
    '@/lib/admin-navigation': { safeAdminDestination: value => value === '/adminauth/blog/' ? value : null },
    './site-publish-control': { SitePublishControl: () => null },
    './dashboard-shell': { DashboardShell: Shell },
    './use-admin-feedback': { useAdminMessage: () => hooks.useState(''), useAdminActivity() {} },
    '@/lib/admin-feedback': { clearAdminNotices() {}, notifyAdmin() {} },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/components/admin/admin-gate.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)(name => dependencies[name] ?? require(name), exports);
  function render() { cursor = 0; tree = exports.AdminGate({ children: 'PRIVATE EDITOR' }); effects.splice(0).forEach(fn => fn()); return tree; }
  function nodes(node = tree) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(item => nodes(item)) : [node, ...(node.props?.children === undefined ? [] : nodes(node.props.children))]; }
  render();
  return {
    render, nodes, redirects, reloads,
    signedIn: (verified = true) => authChanged({ uid: 'test-admin', emailVerified: verified, email: 'admin@example.invalid' }),
    signedOut: () => authChanged(null),
    access: (enabled, fromCache = false, exists = true) => accessChanged({ metadata: { fromCache }, exists: () => exists, data: () => ({ enabled }) }),
    authError: () => authFailed(new Error('offline')), accessError: () => accessFailed(new Error('offline')),
    shell: () => nodes().find(node => node.type === Shell),
    login: () => nodes().find(node => node.type === 'button' && node.props.children === 'Sign in with Google'),
    stops: () => ({ authStops, accessStops }),
    close() { cleanup.forEach(fn => fn?.()); global.window = previousWindow; },
  };
}

test('private admin editors require verified, server-confirmed enabled access and disappear on revocation', () => {
  const h = gate();
  try {
    assert.equal(h.shell(), undefined);
    h.signedIn(); h.render(); h.access(true, true); h.render();
    assert.equal(h.shell(), undefined, 'cached approval does not grant access');
    h.access(true); h.render(); assert.ok(h.shell());
    h.access(false); h.render(); assert.equal(h.shell(), undefined);
    h.signedIn(false); h.access(true); h.render(); assert.equal(h.shell(), undefined);
    h.signedIn(); h.access(false, false, false); h.render(); assert.equal(h.shell(), undefined);
    h.signedOut(); h.render(); assert.ok(h.login());
  } finally { h.close(); }
  assert.ok(h.stops().authStops && h.stops().accessStops, 'subscriptions clean up');
});

test('Google popup failure restores the login button and permits retry without revealing editors', async () => {
  let reject, attempts = 0;
  const h = gate({ popup: () => { attempts++; return attempts === 1 ? new Promise((_, fail) => { reject = fail; }) : Promise.resolve(); } });
  try {
    h.signedOut(); h.render(); const pending = h.login().props.onClick(); h.render();
    assert.ok(h.nodes().some(node => node.type === 'button' && node.props.disabled));
    reject(new Error('Sign-in was canceled. You can try again.')); await pending; h.render();
    assert.equal(h.login().props.disabled, false);
    assert.ok(h.nodes().some(node => node.props?.role === 'alert'));
    await h.login().props.onClick(); h.render(); assert.equal(attempts, 2); assert.equal(h.shell(), undefined);
  } finally { h.close(); }
});

test('signed-out admin deep links return to login; successful approval restores the requested editor', () => {
  const h = gate({ path: '/adminauth/blog/' });
  try { h.signedOut(); h.render(); assert.deepEqual(h.redirects, ['/adminauth/?next=%2Fadminauth%2Fblog%2F']); } finally { h.close(); }
  const approved = gate({ search: '?next=%2Fadminauth%2Fblog%2F' });
  try { approved.signedIn(); approved.access(true); approved.render(); assert.deepEqual(approved.redirects, ['/adminauth/blog/']); } finally { approved.close(); }
});

test('logout clears the page after sign-out; auth and access errors hide private editors', async () => {
  const h = gate();
  try {
    h.signedIn(); h.access(true); h.render(); await h.shell().props.logout();
    assert.deepEqual(h.reloads, ['/adminauth/']);
    h.accessError(); h.render(); assert.equal(h.shell(), undefined);
    h.signedIn(); h.access(true); h.render(); assert.ok(h.shell());
    h.authError(); h.render(); assert.equal(h.shell(), undefined);
  } finally { h.close(); }
});
