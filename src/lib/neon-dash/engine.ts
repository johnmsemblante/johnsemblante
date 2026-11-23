export const rules = {
  width: 800, height: 400, floor: 322, playerX: 134,
  minSpeed: 270, maxSpeed: 510, gravity: 1700, impulse: 570,
  grace: 0.1, slideTime: 0.62, step: 1 / 120,
};

export type Hazard = { x: number; kind: number; phase: number };
type Coin = { x: number; y: number; taken: boolean };
export type Cue = "jump" | "land" | "slide" | "coin" | "hit";

export function createRun() {
  return {
    time: 0, distance: 0, coins: 0, lift: 0, velocity: 0,
    buffer: 0, grace: rules.grace, slide: 0, dead: false,
    next: 820, hazards: [] as Hazard[], tokens: [] as Coin[],
    burst: 0, burstX: rules.playerX, burstY: rules.floor,
  };
}

export type Run = ReturnType<typeof createRun>;
export const speedAt = (time: number) => Math.min(rules.maxSpeed, rules.minSpeed + time * 5);
export const meters = (run: Run) => Math.floor(run.distance / 12);
export function bounds(hazard: Hazard, time: number) {
  if (hazard.kind === 2) return { y: rules.floor - 78, height: 46, width: 48 };
  if (hazard.kind === 3) return { y: rules.floor - 34 + Math.sin(time * 6 + hazard.phase) * 7, height: 25, width: 38 };
  const height = hazard.kind === 0 ? 44 : 21;
  return { y: rules.floor - height, height, width: hazard.kind === 0 ? 33 : 49 };
}

export function advance(run: Run, dt: number, random = Math.random, cue: (event: Cue) => void = () => {}) {
  if (run.dead) return;
  const speed = speedAt(run.time);
  const delta = speed * dt;
  run.time += dt;
  run.distance += delta;
  run.burst = Math.max(0, run.burst - dt);
  run.buffer = Math.max(0, run.buffer - dt);
  run.grace = run.lift === 0 ? rules.grace : Math.max(0, run.grace - dt);
  run.slide = Math.max(0, run.slide - dt);
  if (run.buffer && run.grace && run.lift === 0 && !run.slide) {
    run.velocity = rules.impulse;
    run.grace = run.buffer = 0;
    cue("jump");
  }
  if (run.velocity || run.lift) {
    run.lift += run.velocity * dt;
    run.velocity -= rules.gravity * dt;
    if (run.lift <= 0) {
      run.lift = run.velocity = 0;
      run.burst = 0.24;
      run.burstX = rules.playerX;
      run.burstY = rules.floor;
      cue("land");
    }
  }
  run.next -= delta;
  if (run.next <= rules.width) {
    const kind = run.time < 9 ? Math.floor(random() * 2) : Math.floor(random() * (run.time < 22 ? 3 : 4));
    run.hazards.push({ x: rules.width, kind, phase: random() * Math.PI * 2 });
    for (let index = 0; index < 7; index++) {
      run.tokens.push({ x: rules.width - 93 + index * 30, y: rules.floor - (kind === 2 ? 17 : 39 + Math.sin(index * Math.PI / 6) * 73), taken: false });
    }
    run.next += speed * (1.55 + Math.max(0.15, 0.85 - run.time / 80) * random());
  }
  const foot = rules.floor - run.lift;
  const height = run.slide ? 23 : 51;
  for (const hazard of run.hazards) {
    hazard.x -= delta;
    const box = bounds(hazard, run.time);
    if (hazard.x < rules.playerX + 12 && hazard.x + box.width > rules.playerX - 11 && foot > box.y && foot - height < box.y + box.height) {
      run.dead = true;
      cue("hit");
      break;
    }
  }
  for (const token of run.tokens) {
    token.x -= delta;
    if (!run.dead && !token.taken && Math.abs(token.x - rules.playerX) < 21 && token.y > foot - height - 9 && token.y < foot + 9) {
      token.taken = true;
      run.coins++;
      run.burst = 0.22;
      run.burstX = token.x;
      run.burstY = token.y;
      cue("coin");
    }
  }
  while (run.hazards[0]?.x < -60) run.hazards.shift();
  while (run.tokens[0]?.x < -20) run.tokens.shift();
}
