const WIDTH = 800;
const HEIGHT = 1034;
const FORMATION_MS = 4100;

type Grain = {
  x: number; y: number; startX: number; startY: number;
  delay: number; duration: number; size: number; depth: number; star: boolean;
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
  const art = photo.parentElement!;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  let width = 1, height = 1, left = 0, top = 0, scaleX = 1, scaleY = 1;
  function measure() {
    const field = canvas.getBoundingClientRect();
    const portrait = photo.getBoundingClientRect();
    width = field.width;
    height = field.height;
    left = portrait.left - field.left;
    top = portrait.top - field.top;
    scaleX = portrait.width / WIDTH;
    scaleY = portrait.height / HEIGHT;
    const density = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    ctx!.setTransform(density, 0, 0, density, 0, 0);
  }
  measure();
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
      const depth = random();
      // Neighboring parts of the sketch approach from loose, offset wisps.
      // Gaussian scatter leaves feathered tails beyond the visible hero bounds.
      const u = x / WIDTH, v = y / HEIGHT;
      const ripple = Math.sin(v * 9 + u * 3);
      const fold = Math.sin(u * 8 - v * 4 + .8);
      const angle = random() * 2 * Math.PI;
      const scatter = Math.sqrt(-2 * Math.log(1 - random())) * (.055 + .18 * depth);
      const startX = .5 + 1.45 * (u - .5) + .28 * ripple + scatter * Math.cos(angle);
      const startY = .5 + 1.08 * (v - .5) + .18 * fold + scatter * Math.sin(angle);
      const delay = .05 + .10 * (1 + ripple) + .09 * random();
      const finish = .78 + .13 * depth + .09 * random();
      bands[Math.round(light * 31)].push({
        x, y, depth, star: random() < .055, startX, startY,
        delay, duration: finish - delay,
        size: step * Math.sqrt(coverage) * (.62 + .52 * (1 - light)) * (.75 + random() * .42),
      });
    }
  }

  function grains(target: CanvasRenderingContext2D, progress: number) {
    const zoom = .89 + .11 * smooth((progress - .48) / .52);
    const centerX = left + WIDTH * scaleX / 2;
    const centerY = top + HEIGHT * scaleY / 2;
    for (const [i, band] of bands.entries()) {
      target.fillStyle = colors[i];
      for (const g of band) {
        if (!g.star && progress <= g.delay) continue;
        const t = progress === 1 ? 1 : smooth((progress - g.delay) / g.duration);
        const flying = 1 - t;
        const fromX = g.startX * width, fromY = g.startY * height;
        const toX = centerX + (g.x - WIDTH / 2) * scaleX * zoom;
        const toY = centerY + (g.y - HEIGHT / 2) * scaleY * zoom;
        const x = fromX * flying + toX * t;
        const y = fromY * flying + toY * t;
        const size = (.65 + g.depth * 1.9) * flying + g.size * scaleX * zoom * t;
        const arrival = smooth(t / .75);
        target.globalAlpha = g.star ? (.24 + .48 * g.depth) * (1 - arrival) + arrival : arrival;
        target.fillRect(x - size / 2, y - size / 2, size, size * .93);
      }
    }
    target.globalAlpha = 1;
  }
  let frame = 0, elapsed = 0, previous = 0;
  let complete = false;

  function draw(now: number) {
    const dt = previous ? Math.min(70, now - previous) : 0;
    previous = now;
    elapsed += dt;
    const progress = Math.min(1, elapsed / FORMATION_MS);
    ctx!.clearRect(0, 0, width, height);
    grains(ctx!, progress);
    if (progress === 1) {
      frame = 0;
      complete = true;
      art.dataset.portrait = "complete";
    } else {
      frame = requestAnimationFrame(draw);
    }
  }

  const observer = new ResizeObserver(() => {
    measure();
    grains(ctx!, complete ? 1 : Math.min(1, elapsed / FORMATION_MS));
  });
  observer.observe(canvas);
  observer.observe(photo);
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
      observer.disconnect();
      delete art.dataset.portrait;
      ctx.clearRect(0, 0, width, height);
    },
  };
}
