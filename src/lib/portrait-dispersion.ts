export const dispersionSettings = {
  sampleWidth: 480, fractureStart: 0.54, fractureWidth: 0.21, scatter: 105, desktopCount: 3600, tabletCount: 1800,
  minSize: 0.65, maxSize: 6.2, cursorRadius: 145, displacement: 58, spring: 0.038, damping: 0.86,
  maxPixelRatio: 2,
};

const settings = dispersionSettings;

function sampleSilhouette(image: HTMLImageElement) {
  const sampler = document.createElement("canvas");
  const width = sampler.width = settings.sampleWidth;
  const height = sampler.height = Math.round(width * image.naturalHeight / image.naturalWidth);
  const context = sampler.getContext("2d")!;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  // Blend coarse and fine noise so surviving islands retain the portrait texture.
  const noise = new Float32Array(width * height);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random();
  function grain(x: number, y: number, cell: number) {
    const col = Math.floor(x / cell), row = Math.floor(y / cell);
    const index = row * width + col;
    const fx = x / cell - col, fy = y / cell - row;
    return (1 - fy) * (noise[index] * (1 - fx) + noise[index + 1] * fx)
      + fy * (noise[index + width] * (1 - fx) + noise[index + width + 1] * fx);
  }
  const candidates: number[] = [];
  const mask = context.createImageData(width, height);
  for (let i = 0; i < noise.length; i++) {
    if (!pixels.data[i * 4 + 3]) continue;
    const x = i % width, y = Math.floor(i / width);
    const boundary = settings.fractureStart + 0.045 * Math.sin(y / height * 9 - 1.6);
    const erosion = (x / width - boundary) / settings.fractureWidth;
    const texture = grain(x, y, 17) * 0.46 + grain(x, y, 5) * 0.42 + noise[i] * 0.12;
    const loss = Math.max(0, Math.min(1, (erosion - texture + 0.48) * 5));
    mask.data[i * 4 + 3] = 255 * (1 - loss);
    if (loss > 0.25 && pixels.data[i * 4 + 3] > 48) candidates.push(i);
  }
  context.putImageData(mask, 0, 0);
  const particles = Array.from({ length: candidates.length ? settings.desktopCount : 0 }, () => {
    const i = candidates[Math.floor(Math.random() * candidates.length)];
    const x = i % width, y = Math.floor(i / width);
    const direction = -0.22 + Math.sin(y * 0.035) * 0.24 + (Math.random() - 0.5) * 1.5;
    const flight = Math.random() ** 2.4;
    const offset = flight * settings.scatter;
    const seam = width * (settings.fractureStart + 0.045 * Math.sin(y / height * 9 - 1.6));
    const depositX = seam + (x - seam) * (0.22 + 0.78 * flight);
    const p = i * 4;
    const angle = Math.random() * Math.PI * 2;
    const size = settings.minSize + Math.random() ** 2.8 * (settings.maxSize - settings.minSize) * (1 - flight * 0.6);
    return {
      x: (depositX + Math.random() + Math.cos(direction) * offset) / width,
      y: (y + Math.random() + Math.sin(direction) * offset) / width,
      size, shardX: Math.cos(angle) * size, shardY: Math.sin(angle) * size,
      colour: `rgba(${pixels.data[p]},${pixels.data[p+1]},${pixels.data[p+2]},${pixels.data[p+3]/255 * (0.5 + Math.random()*0.5) * (1 - flight * 0.75)})`,
      dx: 0, dy: 0, vx: 0, vy: 0,
    };
  });
  return { particles, mask: `url("${sampler.toDataURL()}")` };
}

export function createDispersion(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const art = canvas.parentElement!;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const ctx = context;
  const { particles, mask } = sampleSilhouette(image);
  let width = 0, height = 0, count = 0, active = false, frame = 0, last = 0, slowFrames = 0;
  let cursorX = Infinity, cursorY = Infinity;
  let intensity = 1, maskApplied = false;

  function schedule() {
    if (active && !frame) frame = requestAnimationFrame(draw);
  }
  function draw(time: number) {
    frame = 0;
    const interval = last ? time - last : 16.67;
    const dt = Math.min(2, interval / 16.67);
    const damping = settings.damping ** dt;
    last = time;
    if (interval > 28) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames >= 10) {
      count = Math.max(Math.min(count, 600), Math.floor(count * 0.8));
      slowFrames = 0;
    }
    ctx.clearRect(0, 0, width, height);
    let moving = false;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const x = p.x * width, y = p.y * width;
      const dx = x - cursorX, dy = y - cursorY;
      const distance = Math.hypot(dx, dy);
      const force = distance < settings.cursorRadius
        ? intensity * settings.displacement * (1 - distance / settings.cursorRadius) ** 2 / Math.max(1, distance) : 0;
      const lift = force * distance;
      const targetX = force ? dx * force * 0.65 + lift * 0.48 : 0;
      const targetY = force ? dy * force * 0.65 - lift * 0.63 : 0;
      p.vx = (p.vx + (targetX - p.dx) * settings.spring * dt) * damping;
      p.vy = (p.vy + (targetY - p.dy) * settings.spring * dt) * damping;
      p.dx += p.vx * dt;
      p.dy += p.vy * dt;
      if (Math.abs(targetX - p.dx) + Math.abs(targetY - p.dy) + Math.abs(p.vx) + Math.abs(p.vy) > 0.06) moving = true;
      ctx.fillStyle = p.colour;
      ctx.globalAlpha = 1 - 0.68 * Math.min(1, Math.hypot(p.dx, p.dy) / settings.displacement);
      const px = x + p.dx, py = y + p.dy;
      // Taper the plume before the edge of the canvas.
      ctx.globalAlpha *= Math.max(0, Math.min(1, (width - px) / (width * 0.12)));
      if (p.size < 1.7) {
        ctx.fillRect(px, py, p.size, p.size * 0.8);
      } else {
        ctx.beginPath();
        ctx.moveTo(px + p.shardX, py + p.shardY);
        ctx.lineTo(px - p.shardY * 0.5, py + p.shardX * 0.5);
        ctx.lineTo(px - p.shardX * 0.65, py - p.shardY * 0.65);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (!maskApplied) {
      image.style.maskImage = mask;
      maskApplied = true;
    }
    if (moving) schedule(); else last = 0;
  }
  function resize() {
    width = art.clientWidth;
    height = art.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, settings.maxPixelRatio);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const tablet = window.innerWidth <= 1100;
    intensity = tablet ? 0.65 : 1;
    count = Math.min(particles.length, tablet ? settings.tabletCount : settings.desktopCount);
    schedule();
  }
  function move(event: PointerEvent) {
    if (!active || event.pointerType !== "mouse") return;
    const box = art.getBoundingClientRect();
    cursorX = event.clientX - box.left;
    cursorY = event.clientY - box.top;
    schedule();
  }
  function reset() { cursorX = cursorY = Infinity; schedule(); }
  const observer = new ResizeObserver(resize);
  observer.observe(art);
  art.addEventListener("pointermove", move);
  art.addEventListener("pointerleave", reset);
  art.addEventListener("pointercancel", reset);
  resize();
  return {
    setActive(value: boolean) {
      active = value;
      if (active) schedule();
      else { cancelAnimationFrame(frame); frame = last = 0; reset(); }
    },
    dispose() {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      art.removeEventListener("pointermove", move);
      art.removeEventListener("pointerleave", reset);
      art.removeEventListener("pointercancel", reset);
      image.style.removeProperty("mask-image");
      ctx.clearRect(0, 0, width, height);
    },
  };
}
