const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {
  const output = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), output);
  return output;
}
const model = load('src/lib/blog-model.ts');
function harness(componentPath, exportName, initialProps) {
  const state = []; let index = 0; let props = initialProps; let tree;
  const ref = { current: { setCustomValidity(value) { ref.validity = value; } } };
  const hooks = { useState(initial) { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; }, useRef: () => ref };
  const component = load(componentPath, { react: hooks, '@/lib/blog-model': model })[exportName];
  function render() { index = 0; tree = component({ ...props, onChange: values => { props = { ...props, values }; } }); }
  function nodes(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(item => nodes(item)); return [node, ...nodes(node.props?.children)]; }
  render();
  return { render, nodes: () => nodes(tree), input: () => nodes(tree).find(n => n.type === 'input').props, values: () => props.values, ref };
}
function token(maximum = 10) { return harness('src/components/admin/token-input.tsx', 'TokenInput', { id: 'categories', label: 'Categories', values: [], maximum }); }
function type(h, value, composing = false) { h.input().onChange({ target: { value }, nativeEvent: { isComposing: composing } }); h.render(); }
function paste(h, value, start, end) {
  let prevented = false;
  h.input().onPaste({ clipboardData: { getData: () => value }, currentTarget: { selectionStart: start, selectionEnd: end }, preventDefault() { prevented = true; } }); h.render();
  return prevented;
}
test('typed delimiters create chips immediately while the unfinished label stays editable', () => {
  const h = token(); type(h, 'Travel,'); assert.deepEqual(h.values(), ['Travel']); assert.equal(h.input().value, '');
  type(h, 'Cebu, Philippines'); assert.deepEqual(h.values(), ['Travel', 'Cebu']); assert.equal(h.input().value, ' Philippines');
  h.input().onBlur(); h.render(); assert.deepEqual(h.values(), ['Travel', 'Cebu', 'Philippines']);
});
test('pasted comma-separated labels all commit, including the last label, and deduplicate', () => {
  const h = token(); assert.equal(paste(h, 'Cebu, travel, CEBU, , Remote'), true);
  assert.deepEqual(h.values(), ['Cebu', 'travel', 'Remote']); assert.equal(h.input().value, '');
  type(h, 'old'); paste(h, 'Web, Design', 0, 3); assert.deepEqual(h.values(), ['Cebu', 'travel', 'Remote', 'Web', 'Design']);
});
test('invalid pastes preserve text for correction and never partially add or truncate labels', () => {
  const h = token(2); paste(h, 'One, Two, Three'); assert.deepEqual(h.values(), []); assert.equal(h.input().value, 'One, Two, Three'); assert.ok(h.ref.validity);
  type(h, ''); paste(h, 'One, Two'); assert.deepEqual(h.values(), ['One', 'Two']); assert.equal(h.ref.validity, '');
  const long = token(); paste(long, 'One, ' + 'x'.repeat(81)); assert.deepEqual(long.values(), []); assert.ok(long.input().value.endsWith('x'.repeat(81)));
});
test('composition does not commit early; Enter and Backspace remain usable', () => {
  const h = token(); type(h, 'Web,', true); assert.deepEqual(h.values(), []);
  h.input().onCompositionEnd({ currentTarget: { value: 'Web,' } }); h.render(); assert.deepEqual(h.values(), ['Web']);
  type(h, 'Cebu'); let prevented = false; h.input().onKeyDown({ key: 'Enter', nativeEvent: {}, preventDefault() { prevented = true; } }); h.render(); assert.equal(prevented, true); assert.deepEqual(h.values(), ['Web', 'Cebu']);
  h.input().onKeyDown({ key: 'Backspace', nativeEvent: {} }); h.render(); assert.deepEqual(h.values(), ['Web']);
});
test('featured image uses the site logo for absent, unsafe or failed URLs and recovers on a new URL', () => {
  const empty = harness('src/components/blog-featured-image.tsx', 'BlogFeaturedImage', {});
  assert.ok(empty.nodes().some(n => n.props?.['aria-label'] === 'John Semblante logo'));
  const unsafe = harness('src/components/blog-featured-image.tsx', 'BlogFeaturedImage', { src: 'javascript:bad' }); assert.ok(!unsafe.nodes().some(n => n.type === 'img'));
  const props = { src: 'https://example.com/a.webp', alt: 'Coastline' };
  const h = harness('src/components/blog-featured-image.tsx', 'BlogFeaturedImage', props);
  const image = h.nodes().find(n => n.type === 'img'); assert.equal(image.props.alt, props.alt); image.props.onError(); h.render(); assert.ok(!h.nodes().some(n => n.type === 'img'));
  props.src = 'https://example.com/b.webp'; h.render(); assert.ok(h.nodes().some(n => n.type === 'img'));
});
