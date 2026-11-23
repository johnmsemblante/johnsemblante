const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const engine = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/engine.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(engine);
const { advance, createRun, meters, speedAt, rules } = engine;
const progression = {};
const audio = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/audio.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(audio);
const activity = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/activity.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(activity);
const worlds = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/worlds.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(worlds);
new Function('exports', 'require', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/progression.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(progression, name => ({ './worlds': worlds, './activity': activity, './audio': audio })[name]);
const { playerKey, loadPlayer, parsePlayer, finishRun, changeCosmetic, cosmetics } = progression;

test('old saves keep mute and progress while invalid volume settings are normalized', () => {
  const base = { ...progression.newPlayer(), best: 410, sound: true };
  const old = parsePlayer(JSON.stringify({ ...base, audio: undefined, reducedEffects: undefined }));
  assert.deepEqual(old.audio, audio.defaultLevels);
  assert.equal(old.sound, true);
  assert.equal(old.best, 410);
  const normalized = parsePlayer(JSON.stringify({ ...base, audio: { master: 4, effects: -2 }, reducedEffects: true }));
  assert.deepEqual(normalized.audio, { master: 1, effects: 0 });
  assert.equal(normalized.reducedEffects, true);
  assert.deepEqual(parsePlayer(JSON.stringify(normalized)), normalized);
});

test('muted and zero-volume audio never create a browser audio context', async () => {
  const sound = audio.createAudio();
  sound.configure(false, audio.defaultLevels);
  await sound.unlock();
  sound.play('coin');
  sound.configure(true, { master: 1, effects: 0 });
  await sound.unlock();
  sound.play('jump');
  sound.close();
});

test('daily objectives are deterministic, distinct and pay once without inflating collected coins', () => {
  const now = new Date('2026-11-23T23:59:59Z');
  const tomorrow = new Date('2026-11-24T00:00:00Z');
  const date = activity.utcDay(now);
  const set = activity.challenges(date);
  assert.deepEqual(set, activity.challenges(date));
  assert.deepEqual(set.map(item => item.reward), [50, 100, 150]);
  assert.equal(new Set(set.map(item => item.metric)).size, 3);
  const player = progression.newPlayer();
  assert.equal(progression.claimChallenge(player, set[0].id, now), player);
  const daily = { date, stats: activity.readStats({ [set[0].metric]: set[0].target }), claimed: [] };
  const eligible = { ...player, daily };
  const claimed = progression.claimChallenge(eligible, set[0].id, now);
  assert.equal(claimed.wallet, 50);
  assert.equal(claimed.collected, 0);
  const reloaded = parsePlayer(JSON.stringify(claimed));
  assert.deepEqual(reloaded, claimed);
  assert.equal(progression.claimChallenge(reloaded, set[0].id, now), reloaded);
  assert.equal(progression.claimChallenge(eligible, set[0].id, tomorrow), eligible);
  const next = finishRun(reloaded, { credited: false }, 2, 15, {}, tomorrow);
  assert.deepEqual(next.daily.claimed, []);
  assert.equal(next.daily.date, '2026-11-24');
  assert.equal(next.daily.stats.coins, 2);
  assert.equal(next.wallet, 52);
});

test('stats aggregate on one receipt and achievement timestamps survive saves and later runs', () => {
  const now = new Date('2026-11-23T12:00:00Z');
  const receipt = { credited: false };
  const first = finishRun(progression.newPlayer(), receipt, 100, 50, { jumps: 100, slides: 2, dodges: 5, survival: 180, longest: 180 }, now);
  assert.equal(finishRun(first, receipt, 100, 50, {}, now), first);
  const second = finishRun(first, { credited: false }, 0, 10, { jumps: 1, slides: 1, survival: 2, longest: 2 }, now);
  assert.deepEqual([second.stats.runs, second.stats.jumps, second.stats.slides, second.stats.dodges, second.stats.survival, second.stats.longest], [2, 101, 3, 5, 182, 180]);
  assert.deepEqual(Object.keys(second.achievements).sort(), ['collector', 'first', 'jumper', 'survivor']);
  assert.equal(parsePlayer(JSON.stringify(second)).achievements.first, now.toISOString());
});

test('each world renders its own palette with the same simulation and equipped cosmetics', () => {
  const art = {};
  const previous = global.document;
  const frames = [];
  const context = () => new Proxy({
    createLinearGradient: () => ({ addColorStop: (position, color) => frames.push(color) }),
    fillRect() { frames.push(this.fillStyle); },
  }, { get: (target, key) => target[key] ?? (() => {}) });
  global.document = { createElement: () => ({ getContext: context }) };
  try {
    new Function('exports', 'require', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/art.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText)(art, name => ({ './engine': engine, './worlds': worlds, './progression': progression })[name]);
    const draw = art.buildRenderer(context());
    const run = createRun();
    run.hazards.push({ x: 500, kind: 0, phase: 0 });
    const before = JSON.stringify(run);
    for (const world of worlds.worlds) {
      frames.length = 0;
      draw(run, true, false, { skins: 'gold', trails: 'streak' }, world.id);
      assert.ok(frames.includes(world.sky[0]) && frames.includes(world.deck));
      assert.ok(frames.includes('#ffcf62') && frames.includes('#ff6279'));
      assert.equal(JSON.stringify(run), before);
    }
  } finally { global.document = previous; }
});

test('world progression starts at zero on old saves and unlocks once at each threshold', () => {
  const legacy = parsePlayer(JSON.stringify({ ...progression.newPlayer(), best: 2500, earned: 20, wallet: 20, lifetimeDistance: undefined, unlocked: undefined, world: undefined }));
  assert.equal(legacy.best, 2500);
  assert.equal(legacy.lifetimeDistance, 0);
  assert.deepEqual(legacy.unlocked, ['neon-downtown']);
  assert.equal(progression.selectWorld(legacy, 'cyber-rooftops'), legacy);
  const first = finishRun(legacy, { credited: false }, 2, 749);
  const receipt = { credited: false };
  const second = finishRun(first, receipt, 1, 1);
  assert.deepEqual(second.unlocked, ['neon-downtown', 'cyber-rooftops']);
  assert.equal(finishRun(second, receipt, 1, 1), second);
  const selected = progression.selectWorld(second, 'cyber-rooftops');
  assert.deepEqual(parsePlayer(JSON.stringify(selected)), selected);
  assert.equal(parsePlayer(JSON.stringify({ ...selected, lifetimeDistance: null })).world, 'cyber-rooftops');
  assert.equal(parsePlayer(JSON.stringify({ ...selected, world: 'bogus' })).world, 'neon-downtown');
  const third = finishRun(selected, { credited: false }, 0, 1250);
  assert.deepEqual(third.unlocked, ['neon-downtown', 'cyber-rooftops', 'glitch-district']);
  assert.equal(third.wallet, 23);
});

test('V1 score and sound migrate without writing over existing saves', () => {
  const data = new Map([['neon-dash:v1:high-score', '432'], ['neon-dash:v1:sound', 'on']]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: () => assert.fail('migration must not overwrite storage') };
  const { player } = loadPlayer(storage);
  assert.equal(player.best, 432);
  assert.equal(player.sound, true);
  assert.deepEqual(player.equipped, { skins: 'neon', trails: 'cyan' });
  data.set(playerKey, JSON.stringify({ ...player, best: 700 }));
  assert.equal(loadPlayer(storage).player.best, 700);
  data.set(playerKey, '{broken');
  assert.ok(loadPlayer(storage).warning);
  assert.equal(data.get(playerKey), '{broken');
});

test('completed runs credit once; purchases and equipped items survive serialization', () => {
  const initial = progression.newPlayer();
  assert.deepEqual(cosmetics.skins.map(item => item.price), [0, 150, 300, 500, 1000]);
  assert.deepEqual(cosmetics.trails.map(item => item.price), [0, 100, 250, 500]);
  assert.equal(changeCosmetic(initial, 'skins', 'shadow', 'buy').player, initial);
  assert.equal(changeCosmetic(initial, 'skins', 'shadow', 'equip').player, initial);
  assert.equal(changeCosmetic(initial, 'trails', 'unknown', 'buy').player, initial);
  const receipt = { credited: false };
  const rewarded = finishRun(initial, receipt, 250, 501);
  assert.equal(finishRun(rewarded, receipt, 250, 501), rewarded);
  let player = changeCosmetic(rewarded, 'skins', 'shadow', 'buy').player;
  assert.equal(changeCosmetic(player, 'skins', 'shadow', 'buy').player, player);
  player = changeCosmetic(player, 'trails', 'pulse', 'buy').player;
  player = changeCosmetic(player, 'skins', 'shadow', 'equip').player;
  player = changeCosmetic(player, 'trails', 'pulse', 'equip').player;
  assert.deepEqual(parsePlayer(JSON.stringify(player)), player);
  assert.deepEqual(player.equipped, { skins: 'shadow', trails: 'pulse' });
  assert.deepEqual([player.earned, player.spent, player.wallet, player.best], [250, 250, 0, 501]);
  assert.equal(parsePlayer(JSON.stringify({ ...player, wallet: 5 })), null);
});

test('all hazard types can be cleared at every sampled speed', () => {
  for (const time of [0, 10, 20, 32, 45, 60, 120]) {
    for (let kind = 0; kind < 4; kind++) {
      for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const run = createRun();
        run.time = time;
        run.next = 10000;
        run.hazards.push({ kind, phase, x: rules.playerX + 12 + speedAt(time) * .21 });
        if (kind === 2) run.slide = rules.slideTime;
        else run.buffer = rules.grace;
        for (let tick = 0; tick < 120; tick++) advance(run, rules.step);
        assert.equal(run.dead, false, `time ${time}, kind ${kind}, phase ${phase}`);
        assert.ok(meters(run) > 0);
      }
    }
  }
});

test('collision ends scoring, and restart resets distance, coins and obstacles', () => {
  const run = createRun();
  run.hazards.push({ x: rules.playerX, kind: 0, phase: 0 });
  advance(run, rules.step);
  assert.equal(run.dead, true);
  const distance = run.distance;
  advance(run, rules.step);
  assert.equal(run.distance, distance);
  assert.deepEqual(createRun(), { ...createRun(), distance: 0, coins: 0, hazards: [] });
});

test('coins collect once and a buffered jump survives the landing', () => {
  const run = createRun();
  const events = [];
  run.tokens.push({ x: rules.playerX, y: rules.floor - 18, taken: false });
  run.lift = 3;
  run.velocity = -400;
  run.buffer = rules.grace;
  for (let tick = 0; tick < 10; tick++) advance(run, rules.step, () => 0, event => events.push(event));
  assert.equal(run.coins, 1);
  assert.ok(run.lift > 0);
  assert.ok(events.includes('land') && events.includes('jump'));
});

test('a long deterministic run keeps generated objects bounded and speed capped', () => {
  const run = createRun();
  for (let tick = 0; tick < 20000; tick++) {
    const upcoming = run.hazards.find(hazard => hazard.x > rules.playerX + 12);
    if (upcoming && upcoming.x < rules.playerX + 12 + speedAt(run.time) * .21 && !run.lift && !run.slide) {
      if (upcoming.kind === 2) run.slide = rules.slideTime;
      else run.buffer = rules.grace;
    }
    advance(run, rules.step, () => .99);
    assert.equal(run.dead, false);
    assert.ok(run.hazards.length < 6 && run.tokens.length < 40);
  }
  assert.equal(speedAt(run.time), rules.maxSpeed);
});
