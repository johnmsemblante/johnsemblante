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
  const source = surface(WIDTH, HEIGHT);
  source.drawImage(photo, 0, 0, WIDTH, HEIGHT);
  const pixels = source.getImageData(0, 0, WIDTH, HEIGHT).data;

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
      const coverage = pixels[offset + 3] / 255;
      if (!coverage) continue;
      const light = (pixels[offset] * .3 + pixels[offset + 1] * .59 + pixels[offset + 2] * .11) / 255;
      const angle = random() * Math.PI * 2;
      const depth = random();
      const lobe = 1 + .21 * Math.sin(3 * angle + .7) + .13 * Math.cos(5 * angle);
      const radius = (70 + depth * 124 + random() * 40 + 22 * Math.sin(2 * angle + depth * 6)) * lobe;
      bands[Math.round(light * 31)].push({
        x, y, startX: 393 + radius * Math.cos(angle),
        startY: 452 + radius * Math.sin(angle) * .77 - 34 * Math.cos(angle),
        bend: (depth - .4) * 175, delay: .06 + .19 * random() + .13 * y / HEIGHT,
        size: step * Math.sqrt(coverage) * (.62 + .52 * (1 - light)) * (.75 + random() * .42),
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
  let frame = 0, elapsed = 0, previous = 0;
  let complete = false;

  function draw(now: number) {
    const dt = previous ? Math.min(70, now - previous) : 0;
    previous = now;
    elapsed += dt;
    const progress = Math.min(1, elapsed / FORMATION_MS);
    ctx!.clearRect(0, 0, WIDTH, HEIGHT);
    grains(ctx!, progress);
    if (progress === 1) {
      frame = 0;
      complete = true;
      art.dataset.portrait = "complete";
    } else {
      frame = requestAnimationFrame(draw);
    }
  }

  grains(ctx, 0);
  art.dataset.portrait = "forming";
  return {
    setActive(active: boolean) {
      if (!active) {
        cancelAnimationFrame(frame);
        frame = previous = 0;
      } else if (!complete && !frame) {
        frame = requestAnimationFrame(draw);
      }
    },
    dispose() {
      cancelAnimationFrame(frame);
      delete art.dataset.portrait;
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
    },
  };
}
