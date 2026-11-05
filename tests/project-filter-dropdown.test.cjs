const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Exercise markup, event handlers and dismissal listeners with stable hook refs.
function dropdown() {
  const refs = []; const calls = []; const effects = []; let closed = 0; let focused = false;
  const react = { useId: () => 'test-filter', useEffect(callback) { effects.push(callback); }, useState: value => [value, () => {}], useRef: () => { const ref = { current: null }; refs.push(ref); return ref; } };
  const exported = {};
  const code = ts.transpileModule(fs.readFileSync('src/components/project-filter-dropdown.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)(name => name === 'react' ? react : require(name), exported);
  const element = exported.ProjectFilterDropdown({ label: 'Technology', options: [{ value: 'wordpress', label: 'WordPress', count: 3 }, { value: 'next-js', label: 'Next.js', count: 0, disabled: true }], selected: [], open: true, onOpen() {}, onClose() { closed++; }, onToggle(value) { calls.push(value); }, onClear() {} });
  refs[1].current = { focus() { focused = true; }, getBoundingClientRect: () => ({ top: 50, bottom: 100 }) };
  const nodes = [];
  function walk(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) { node.forEach(walk); return; } nodes.push(node); walk(node.props?.children); }
  walk(element);
  return { element, nodes, calls, refs, effects, closed: () => closed, focused: () => focused };
}

test('option text and count share the native label association without an intercepting click handler', () => {
  const h = dropdown(); const row = h.nodes.find(node => node.type === 'label' && node.props.htmlFor === 'test-filter-0');
  const checkbox = h.nodes.find(node => node.type === 'input' && node.props.value === 'wordpress');
  assert.equal(row.props.onClick, undefined); assert.equal(row.props.htmlFor, checkbox.props.id);
  assert.ok(row.props.children.some(child => child?.type === 'span'));
  assert.ok(row.props.children.some(child => child?.type === 'small'));
  checkbox.props.onChange(); assert.deepEqual(h.calls, ['wordpress']);
});

test('unavailable labels and checkboxes cannot toggle, and Escape closes the panel and restores trigger focus', () => {
  const h = dropdown();
  const row = h.nodes.find(node => node.type === 'label' && node.props.htmlFor === 'test-filter-1');
  assert.equal(row.props.onClick, undefined);
  const input = h.nodes.find(node => node.type === 'input' && node.props.value === 'next-js');
  assert.equal(input.props.disabled, true); input.props.onChange(); assert.equal(h.calls.length, 0);
  h.element.props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
  assert.equal(h.closed(), 1); assert.equal(h.focused(), true);
});

test('label pointer presses and transient body focus keep the panel open; actual outside interactions still close it', () => {
  const h = dropdown(); const inside = {}; const controlOutside = {};
  const originalDocument = globalThis.document; const originalWindow = globalThis.window;
  const listeners = new Map();
  const fakeDocument = { body: {}, documentElement: {}, addEventListener(name, callback) { listeners.set(name, callback); }, removeEventListener(name) { listeners.delete(name); } };
  try {
    globalThis.document = fakeDocument; globalThis.window = { innerHeight: 1000, addEventListener() {}, removeEventListener() {} };
    h.refs[0].current = { contains: target => target === inside };
    const cleanup = h.effects[0]();
    listeners.get('pointerdown')({ target: inside });
    listeners.get('focusin')({ target: fakeDocument.body });
    listeners.get('focusin')({ target: fakeDocument.documentElement });
    listeners.get('focusin')({ target: inside });
    assert.equal(h.closed(), 0);
    listeners.get('focusin')({ target: controlOutside }); assert.equal(h.closed(), 1);
    listeners.get('pointerdown')({ target: fakeDocument.body }); assert.equal(h.closed(), 2);
    cleanup(); assert.equal(listeners.size, 0);
  } finally {
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  }
});
