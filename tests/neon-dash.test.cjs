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
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/neon-dash/progression.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(progression);
const { playerKey, loadPlayer, parsePlayer, finishRun, changeCosmetic, cosmetics } = progression;

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
