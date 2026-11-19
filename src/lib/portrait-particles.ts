const WIDTH = 800;
const HEIGHT = 1034;
const FORMATION_MS = 4100;

type Grain = {
  x: number; y: number; startX: number; startY: number;
  bend: number; delay: number; size: number;
};

function smooth(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function surface(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D unavailable");
  return context;
}

export function createParticlePortrait(photo: HTMLImageElement, canvas: HTMLCanvasElement) {
  const art = canvas.parentElement!;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const settled = surface(WIDTH, HEIGHT);
  settled.drawImage(photo, 0, 0, WIDTH, HEIGHT);
  const pixels = settled.getImageData(0, 0, WIDTH, HEIGHT).data;
  settled.clearRect(0, 0, WIDTH, HEIGHT);

  // Stratified samples retain the eyes and hairline without a visible dot grid.
  const bands: Grain[][] = Array.from({ length: 32 }, () => []);
  const colors = bands.map((_, i) => {
    const tone = Math.round(18 + i * 6.2);
    return `rgb(${tone + 3},${tone + 2},${tone})`;
  });
  let seed = 4701;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const step = art.clientWidth < 440 ? 6 : 4.8;
  for (let row = 0; row < HEIGHT - step; row += step) {
    for (let col = 0; col < WIDTH - step; col += step) {
      const x = col + random() * step, y = row + random() * step;
      const offset = 4 * (Math.floor(y) * WIDTH + Math.floor(x));
      if (pixels[offset + 3] < 100) continue;
      const light = (pixels[offset] * .3 + pixels[offset + 1] * .59 + pixels[offset + 2] * .11) / 255;
      const angle = random() * Math.PI * 2;
      const depth = random();
      const lobe = 1 + .21 * Math.sin(3 * angle + .7) + .13 * Math.cos(5 * angle);
      const radius = (70 + depth * 124 + random() * 40 + 22 * Math.sin(2 * angle + depth * 6)) * lobe;
      bands[Math.round(light * 31)].push({
        x, y, startX: 393 + radius * Math.cos(angle),
        startY: 452 + radius * Math.sin(angle) * .77 - 34 * Math.cos(angle),
        bend: (depth - .4) * 175, delay: .06 + .19 * random() + .13 * y / HEIGHT,
        size: step * (.62 + .52 * (1 - light)) * (.75 + random() * .42),
      });
    }
  }

  function grains(target: CanvasRenderingContext2D, progress: number) {
    for (const [i, band] of bands.entries()) {
      target.fillStyle = colors[i];
      for (const g of band) {
        const t = progress === 1 ? 1 : smooth((progress - g.delay) / (1 - g.delay));
        const flying = 1 - t, arc = 4 * t * flying;
        const x = g.x + (g.startX - g.x) * flying + g.bend * arc;
        const y = g.y + (g.startY - g.y) * flying - (g.bend * .48 + 38) * arc;
        const size = g.size * (1 - .65 * flying);
        target.fillRect(x - size / 2, y - size / 2, size, size * .93);
      }
    }
  }
  // A faint photographic base keeps fine features legible through the grains.
  const undertone = surface(WIDTH, HEIGHT);
  undertone.filter = "grayscale(1)";
  undertone.globalAlpha = .46;
  undertone.drawImage(photo, 0, 0, WIDTH, HEIGHT);
  settled.drawImage(undertone.canvas, 0, 0);
  grains(settled, 1);

  // Offset soft lobes expose a continuous patch of the same photograph.
  const brush = surface(320, 320);
  for (const [x, y, radius] of [[157, 153, 145], [192, 161, 108], [138, 197, 94]]) {
    const fade = brush.createRadialGradient(x, y, radius * .35, x, y, radius);
    fade.addColorStop(0, "#000"); fade.addColorStop(1, "transparent");
    brush.fillStyle = fade;
    brush.fillRect(0, 0, 320, 320);
  }
  const patch = surface(320, 320);
  let frame = 0, active = false, elapsed = 0, previous = 0;
  let x = 400, y = 430, targetX = x, targetY = y, strength = 0, hovered = false;
  function queue() { if (active && !frame) frame = requestAnimationFrame(draw); }
  function draw(now: number) {
    frame = 0;
    const dt = previous ? Math.min(70, now - previous) : 16;
    previous = now;
    elapsed = Math.min(FORMATION_MS, elapsed + dt);
    const progress = elapsed / FORMATION_MS;
    const gain = 1 - Math.exp(-dt / 85);
    x += (targetX - x) * gain; y += (targetY - y) * gain;
    const goal = hovered ? 1 : 0;
    strength += (goal - strength) * (1 - Math.exp(-dt / 145));
    ctx!.clearRect(0, 0, WIDTH, HEIGHT);
    if (progress === 1) ctx!.drawImage(settled.canvas, 0, 0);
    else {
      const base = smooth((progress - .67) / .33);
      if (base > 0) {
        ctx!.globalAlpha = base;
        ctx!.drawImage(undertone.canvas, 0, 0);
        ctx!.globalAlpha = 1;
      }
      grains(ctx!, progress);
    }
    const opacity = strength * smooth((progress - .57) / .43);
    if (opacity > .002) {
      patch.clearRect(0, 0, 320, 320);
      patch.drawImage(photo, 160 - x, 160 - y, WIDTH, HEIGHT);
      patch.globalCompositeOperation = "destination-in";
      patch.drawImage(brush.canvas, 0, 0);
      patch.globalCompositeOperation = "source-over";
      ctx!.globalAlpha = opacity;
      ctx!.drawImage(patch.canvas, x - 160, y - 160);
      ctx!.globalAlpha = 1;
    }
    if (progress < 1 || Math.abs(goal - strength) > .002 || Math.abs(x-targetX) + Math.abs(y-targetY) > .25) queue();
    else previous = 0;
  }
  function move(e: PointerEvent) {
    if (e.pointerType === "touch") return;
    const bounds = art.getBoundingClientRect();
    targetX = (e.clientX - bounds.left) * WIDTH / bounds.width;
    targetY = (e.clientY - bounds.top) * HEIGHT / bounds.height;
    if (strength < .002) { x = targetX; y = targetY; }
    hovered = true; queue();
  }
  function leave() { hovered = false; queue(); }
  grains(ctx, 0);
  art.setAttribute("data-particles", "");
  art.addEventListener("pointermove", move);
  art.addEventListener("pointerleave", leave);
  art.addEventListener("pointercancel", leave);
  return {
    setActive(value: boolean) {
      active = value;
      if (active) queue();
      else { cancelAnimationFrame(frame); frame = previous = 0; hovered = false; strength = 0; }
    },
    dispose() {
      active = false; cancelAnimationFrame(frame);
      art.removeEventListener("pointermove", move);
      art.removeEventListener("pointerleave", leave);
      art.removeEventListener("pointercancel", leave);
      art.removeAttribute("data-particles");
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
  };
}
