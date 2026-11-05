const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
const link = { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exported = {}; cache.set(file, exported);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', code)(name => {
    if (name === 'next/link') return link;
    if (name === 'next/navigation') return { notFound() { throw new Error('not-found'); } };
    if (name === '@/components/zoom-image') return { ZoomImage: ({ gallery, caption, ...props }) => React.createElement('img', props) };
    if (name.startsWith('@/') || name.startsWith('.')) {
      const target = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
      return load(fs.existsSync(`${target}.ts`) ? `${target}.ts` : `${target}.tsx`);
    }
    return require(name);
  }, exported);
  return exported;
}
const { projects } = load('src/content/site.ts');
const { industries, industryPath } = load('src/content/industries.ts');
const { proposedProjectDrafts } = load('src/content/project-drafts.ts');
const filters = load('src/lib/project-filters.ts');
const groups = load('src/content/portfolio-filter-groups.ts');
const state = overrides => ({ ...filters.emptyProjectFilters(), ...overrides });
const historicalSlugs = ['e-dee-monnen', 'sharon-kramer-books', 'impact-hygiene', 'roar-fitness', 'nexus-appliances', 'perth-cosmetic-surgery', 'active-kids-group', 'georges-bike-shop', 'northcroft', 'perth-scaffolding', 'trinity-floors', 'loonglist', 'spinning-leaf-films', 'parkwood-chiropractic'];

test('all original projects stay in their original order, with existing links/assets and accurate venture technologies', () => {
  assert.deepEqual(projects.slice(0, 14).map(p => p.slug), historicalSlugs);
  assert.equal(new Set(projects.map(p => p.slug)).size, projects.length);
  for (const project of projects) {
    assert.equal(project.publication, 'published'); assert.ok(project.summary && project.role && project.image?.alt);
    assert.ok(fs.existsSync(path.join('public', project.image.src)));
    assert.ok(project.industries.length && project.industries.every(slug => industries.some(i => i.slug === slug)));
    if (project.status === 'archived') { assert.ok(project.website.startsWith('https://')); assert.equal(project.projectType, 'client'); }
    if (project.projectType === 'venture') { assert.ok(project.technologies.includes('Next.js')); assert.ok(!project.technologies.includes('WordPress')); }
  }
});

test('the five fictional concepts stay unpublished, without invented live URLs or technologies', () => {
  assert.equal(proposedProjectDrafts.length, 5);
  for (const draft of proposedProjectDrafts) {
    assert.equal(draft.publication, 'draft'); assert.equal(draft.status, 'planned'); assert.equal(draft.projectType, 'concept');
    assert.equal(draft.website, undefined); assert.equal(draft.technologies, undefined);
    assert.ok(!projects.some(project => project.slug === draft.slug));
  }
});

test('multi-select filters use OR within a group and AND across groups, without adding unrelated results', () => {
  assert.equal(filters.filterProjects(projects, state()).length, projects.length);
  assert.equal(filters.filterProjects(projects, state({ industries: ['healthcare'], technologies: ['wordpress'], types: ['client-project'] })).length, 3);
  assert.equal(filters.filterProjects(projects, state({ industries: ['healthcare', 'ecommerce'], technologies: ['wordpress'] })).length, 6);
  assert.equal(filters.filterProjects(projects, state({ technologies: ['wordpress', 'next-js'] })).length, projects.length);
  assert.equal(filters.filterProjects(projects, state({ technologies: ['wordpress'], types: ['personal-venture'] })).length, 0);
  assert.equal(filters.filterProjects(projects, state({ industries: ['dental'] })).length, 0);
  assert.deepEqual(filters.filterProjects(projects, state({ industries: ['hospitality-travel'], technologies: ['next-js'] })).map(p => p.slug), ['golden-travel-and-tours']);
  assert.equal(filters.filterProjects([{ ...projects[0], publication: 'draft' }], state()).length, 0);
});

test('shareable filter URLs validate values, retain both filters and support reset/back-state parsing', () => {
  const technologies = ['WordPress', 'UI', 'Next.js'];
  const selected = state({ industries: ['healthcare'], technologies: ['wordpress'], types: ['client-project'] });
  const url = filters.projectFilterUrl('https://example.com/work?unrecognized=1#projects', selected);
  assert.equal(url, '/work/?industry=healthcare&technology=wordpress&type=client-project');
  assert.deepEqual(filters.readProjectFilters(new URL(url, 'https://example.com').search, technologies), selected);
  assert.deepEqual(filters.readProjectFilters('?industry=unrecognized&technology=Unknown&type=unknown', technologies), state());
  assert.deepEqual(filters.readProjectFilters('?industry=travel&technology=UI', technologies, 'dental'), state({ technologies: ['ui'] }));
  assert.equal(filters.projectFilterUrl('https://example.com/work/?industry=dental&technology=UI', state()), '/work/');
  const duplicated = filters.readProjectFilters('?type=client&technology=WordPress,nextjs,react&industry=travel,dental&industry=Dental&technology=wp', technologies);
  assert.deepEqual(duplicated, state({ industries: ['dental', 'hospitality-travel'], technologies: ['next-js', 'wordpress'], types: ['client-project'] }));
  assert.equal(filters.projectFilterUrl('https://example.com/work/', duplicated), '/work/?industry=dental,hospitality-travel&technology=next-js,wordpress&type=client-project');
  assert.deepEqual(filters.readProjectFilters('?q=  WP  &industry=dental&technology=wordpress', technologies), state({ q: 'WP' }));
  assert.equal(filters.projectFilterUrl('https://example.com/work/', state({ q: 'WP', industries: ['dental'] })), '/work/?q=WP');
});

test('facet counts use the other groups, preserve same-group OR choices and keep selected zero-match values removable', () => {
  const tech = filters.technologyOptions(projects);
  const options = filters.projectFacetOptions(projects, state({ industries: ['healthcare'] }), 'technologies', tech);
  assert.equal(options.find(o => o.value === 'wordpress').disabled, false);
  assert.equal(options.find(o => o.value === 'wordpress').count, 3);
  assert.equal(options.find(o => o.value === 'next-js').disabled, true);
  const types = filters.projectFacetOptions(projects, state({ technologies: ['wordpress'] }), 'types', groups.projectTypeOptions);
  assert.equal(types.find(o => o.value === 'personal-venture').disabled, true);
  assert.equal(types.find(o => o.value === 'client-project').disabled, false);
  const industries = filters.projectFacetOptions(projects, state({ industries: ['healthcare'], technologies: ['wordpress'] }), 'industries', groups.portfolioIndustryGroups);
  assert.equal(industries.find(o => o.value === 'ecommerce').disabled, false);
  assert.equal(industries.find(o => o.value === 'hospitality-travel').disabled, true);
  const selected = filters.projectFacetOptions(projects, state({ technologies: ['next-js'], industries: ['healthcare'] }), 'technologies', tech);
  assert.equal(selected.find(o => o.value === 'next-js').count, 0);
  assert.equal(selected.find(o => o.value === 'next-js').disabled, false);
});

test('every enabled option can match the other groups, and a new dropdown ignores the independent keyword search', () => {
  const optionSets = { industries: groups.portfolioIndustryGroups, technologies: filters.technologyOptions(projects), types: groups.projectTypeOptions };
  for (const industry of [undefined, 'healthcare', 'ecommerce', 'hospitality-travel']) for (const technology of [undefined, 'wordpress', 'next-js']) {
    const current = state({ industries: industry ? [industry] : [], technologies: technology ? [technology] : [] });
    if (!filters.filterProjects(projects, current).length) continue;
    for (const [group, choices] of Object.entries(optionSets)) for (const option of filters.projectFacetOptions(projects, current, group, choices)) {
      if (!option.disabled) assert.ok(filters.filterProjects(projects, { ...current, [group]: [option.value] }).length > 0);
    }
  }
  const duringSearch = filters.projectFacetOptions(projects, state({ q: 'WordPress' }), 'technologies', optionSets.technologies);
  assert.equal(duringSearch.find(o => o.value === 'next-js').disabled, false);
  assert.equal(filters.filterProjects(projects, state({ q: 'React', technologies: ['wordpress'] })).length, 2);
});

test('explorer exposes labeled grouped checkboxes, a search/share action and a no-JavaScript collection without flashing unfiltered results', () => {
  const { ProjectExplorer } = load('src/components/project-explorer.tsx');
  const html = renderToStaticMarkup(React.createElement(ProjectExplorer, { projects }));
  assert.ok(html.includes('Portfolio filters')); assert.ok(html.includes('Industry')); assert.ok(html.includes('Technology')); assert.ok(html.includes('Project Type'));
  assert.ok(html.includes('type="checkbox"')); assert.ok(html.includes('aria-controls=')); assert.ok(html.includes('aria-expanded="false"'));
  assert.ok(html.includes('aria-live="polite"')); assert.ok(html.includes('Share these results')); assert.ok(html.includes('Loading portfolio filters'));
  assert.ok(html.includes('<noscript>')); assert.ok(html.includes('Search WordPress, React, real estate, dental...'));
  for (const slug of historicalSlugs) assert.ok(html.includes(`/work/${slug}/`));
  for (const industry of industries) assert.ok(html.includes(industryPath(industry.slug)));
  assert.ok(html.includes('Personal venture')); assert.ok(html.includes('Client project'));
  for (const draft of proposedProjectDrafts) assert.ok(!html.includes(draft.title));
});

test('keyword search handles aliases, multiple words, punctuation, verified features and honest empty technology searches', () => {
  assert.equal(filters.filterProjects(projects, state({ q: '  WP  ' })).length, 14);
  assert.equal(filters.filterProjects(projects, state({ q: 'React' })).length, 2);
  assert.equal(filters.filterProjects(projects, state({ q: 'WooCommerce' })).length, 0);
  assert.deepEqual(filters.filterProjects(projects, state({ q: 'trip inquiry' })).map(p => p.slug), ['golden-travel-and-tours']);
  const property = { ...projects[0], slug: 'property-fixture', title: 'Property listings', industries: ['real-estate'], description: 'An original landing page.', capabilities: ['Property search'], tags: ['Agency'] };
  assert.equal(filters.filterProjects([property], state({ q: 'real estates WP landing-page' })).length, 1);
  assert.equal(filters.filterProjects([property], state({ q: 'agency property search' })).length, 1);
  assert.equal(filters.filterProjects([property], state({ q: 'property dental' })).length, 0);
  assert.equal(filters.filterProjects(projects, state({ q: 'publishing' })).some(p => p.slug === 'roar-fitness'), false);
  const options = filters.technologyOptions(projects).map(option => option.value);
  assert.ok(options.includes('wordpress')); assert.ok(options.includes('next-js'));
  assert.ok(!options.includes('react')); assert.ok(!options.includes('woocommerce'));
});

test('industry normalization preserves old associations and keeps unmatched work visible', () => {
  for (const project of projects) for (const legacy of project.industries) assert.ok(groups.projectIndustryGroups(project).includes(groups.normalizeIndustry(legacy)));
  assert.equal(groups.normalizeIndustry('travel'), 'hospitality-travel'); assert.equal(groups.normalizeIndustry('hospitality'), 'hospitality-travel');
  assert.ok(groups.projectIndustryGroups(projects.find(p => p.slug === 'active-kids-group')).includes('education'));
  assert.ok(groups.projectIndustryGroups(projects.find(p => p.slug === 'nexus-appliances')).includes('ecommerce'));
  assert.deepEqual(groups.projectIndustryGroups({ ...projects[0], industries: ['future-unrecognized-industry'] }), ['other']);
});

test('project details preserve original routes and hide unavailable scope, while venture details show documented features', async () => {
  const page = load('src/app/(portfolio)/work/[slug]/page.tsx');
  const paths = page.generateStaticParams().map(p => p.slug);
  for (const slug of historicalSlugs) assert.ok(paths.includes(slug));
  const archive = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: historicalSlugs[0] }) }));
  assert.ok(archive.includes('Portfolio archive')); assert.ok(!archive.includes('My contributions')); assert.ok(!archive.includes('The outcome'));
  const venture = renderToStaticMarkup(await page.default({ params: Promise.resolve({ slug: 'golden-travel-and-tours' }) }));
  assert.ok(venture.includes('Features implemented')); assert.ok(venture.includes('My contributions')); assert.ok(venture.includes('Next.js'));
  await assert.rejects(page.default({ params: Promise.resolve({ slug: 'smilecraft-dental-studio' }) }), /not-found/);
});

test('nine exported industry routes have unique canonical metadata, truthful empty states and published-only structured lists', async () => {
  const page = load('src/app/(portfolio)/work/industry/[industry]/page.tsx');
  assert.equal(page.generateStaticParams().length, 9);
  const titles = new Set();
  for (const industry of industries) {
    const props = { params: Promise.resolve({ industry: industry.slug }) };
    const metadata = await page.generateMetadata(props); titles.add(metadata.title);
    assert.ok(metadata.alternates.canonical.endsWith(industryPath(industry.slug)));
    const html = renderToStaticMarkup(await page.default(props));
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    const count = projects.filter(p => p.industries.includes(industry.slug)).length;
    assert.equal(data.mainEntity.numberOfItems, count);
    if (!count) { assert.ok(html.includes('No published projects')); assert.ok(metadata.description.includes('No project examples')); }
    for (const draft of proposedProjectDrafts) assert.ok(!html.includes(draft.title));
  }
  assert.equal(titles.size, industries.length);
});
