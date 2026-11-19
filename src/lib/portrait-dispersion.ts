export const dispersionSettings = {
  sampleWidth: 480, fractureStart: 0.54, fractureWidth: 0.21, scatter: 105, desktopCount: 3600, tabletCount: 1800,
  minSize: 0.65, maxSize: 6.2, cursorRadius: 145, revealCore: 0.46, gatherMs: 115, releaseMs: 185, spring: 0.038, damping: 0.86,
  maxPixelRatio: 2, edgeCycleMs: 2250, idleRipple: 0.095, sweepRipple: 0.075, edgeDrift: 0.10,
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
  // Keep the missing texture at the original image resolution for the final join.
  const missing = document.createElement("canvas");
  missing.width = image.naturalWidth;
  missing.height = image.naturalHeight;
  const texture = missing.getContext("2d")!;
  texture.drawImage(image, 0, 0);
  texture.globalCompositeOperation = "destination-out";
  texture.drawImage(sampler, 0, 0, missing.width, missing.height);
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
      sourceX: (x + 0.5) / width, sourceY: (y + 0.5) / width,
      size, shardX: Math.cos(angle) * size, shardY: Math.sin(angle) * size,
      colour: `rgba(${pixels.data[p]},${pixels.data[p+1]},${pixels.data[p+2]},${pixels.data[p+3]/255 * (0.5 + Math.random()*0.5) * (1 - flight * 0.75)})`,
      assembly: 0, velocity: 0,
    };
  });
  // Cache the grain and angular wave coefficients. Only rim pixels change on hover.
  const brush = document.createElement("canvas");
  const side = brush.width = brush.height = 256;
  const brushContext = brush.getContext("2d")!;
  const field = brushContext.createImageData(side, side);
  const rim: { index: number; base: number; sin3: number; cos3: number; sin5: number; cos5: number }[] = [];
  const maxRipple = settings.idleRipple + settings.sweepRipple;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const nx = (x + 0.5) * 2 / side - 1, ny = (y + 0.5) * 2 / side - 1;
      const angle = Math.atan2(ny, nx);
      const contour = 0.69 + 0.13 * Math.sin(3 * angle + 0.6) + 0.065 * Math.cos(5 * angle);
      const clusters = (grain(x, y, 14) - 0.5) * 0.25 + (grain(x, y, 4) - 0.5) * 0.19;
      const grit = (noise[y * width + x] - 0.5) * 0.08;
      const distance = Math.hypot(nx, ny);
      const edge = Math.min(1, Math.max(0, (distance - settings.revealCore) * 6));
      const base = contour - distance + edge * (clusters + grit);
      const index = (y * side + x) * 4 + 3;
      if (distance > settings.revealCore && Math.abs(base) < maxRipple + 0.06) {
        rim.push({ index, base, sin3: Math.sin(3 * angle), cos3: Math.cos(3 * angle),
          sin5: Math.sin(5 * angle), cos5: Math.cos(5 * angle) });
      }
      const coverage = Math.min(1, Math.max(0, base * 9 + 0.5));
      field.data[index] = 255 * coverage * coverage * (3 - 2 * coverage);
    }
  }
  brushContext.putImageData(field, 0, 0);
  function rippleEdge(phase: number, amplitude: number) {
    const a = 0.65 * amplitude * Math.cos(phase), b = 0.65 * amplitude * Math.sin(phase);
    const c = 0.35 * amplitude * Math.cos(2 * phase), d = -0.35 * amplitude * Math.sin(2 * phase);
    for (const pixel of rim) {
      const wave = pixel.sin3 * a + pixel.cos3 * b + pixel.sin5 * c + pixel.cos5 * d;
      const alpha = Math.min(1, Math.max(0, (pixel.base + wave) * 9 + 0.5));
      field.data[pixel.index] = 255 * alpha * alpha * (3 - 2 * alpha);
    }
    brushContext.putImageData(field, 0, 0);
  }
  function brushWeight(u: number, v: number) {
    if (u < 0 || u >= side - 1 || v < 0 || v >= side - 1) return 0;
    const x = Math.floor(u), y = Math.floor(v);
    const index = (y * side + x) * 4 + 3;
    const fx = u - x, fy = v - y;
    const data = field.data;
    const below = index + side * 4;
    return ((1 - fy) * (data[index] * (1 - fx) + data[index + 4] * fx)
      + fy * (data[below] * (1 - fx) + data[below + 4] * fx)) / 255;
  }
  return { particles, missing, brush, brushWeight, rippleEdge, mask: `url("${sampler.toDataURL()}")` };
}

export function createDispersion(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const art = canvas.parentElement!;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const ctx = context;
  const { particles, missing, brush, brushWeight, rippleEdge, mask } = sampleSilhouette(image);
  let width = 0, height = 0, count = 0, active = false, frame = 0, last = 0, slowFrames = 0;
  let cursorX = 0, cursorY = 0, focusX = 0, focusY = 0;
  let hovering = false, reveal = 0, phase = 0, rippleEnergy = 0;
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
    const target = hovering ? 1 : 0;
    const follow = 1 - Math.exp(-dt * 16.67 / 35);
    focusX += (cursorX - focusX) * follow;
    focusY += (cursorY - focusY) * follow;
    reveal += (target - reveal) * (1 - Math.exp(-dt * 16.67 / (hovering ? settings.gatherMs : settings.releaseMs)));
    if (Math.abs(target - reveal) < 0.002) reveal = target;
    const radius = settings.cursorRadius * intensity;
    const left = focusX - radius, top = focusY - radius;
    const brushScale = brush.width / (2 * radius);
    const lag = Math.hypot(cursorX - focusX, cursorY - focusY);
    const energyTarget = hovering ? Math.min(1, lag / (radius * 0.18)) : 0;
    rippleEnergy += (energyTarget - rippleEnergy) * (1 - Math.exp(-dt * 16.67 / 100));
    let moving = hovering || reveal !== target || lag > 0.1;
    if (reveal > 0) {
      phase = (phase + dt * 16.67 * (1 + rippleEnergy) * Math.PI * 2 / settings.edgeCycleMs) % (Math.PI * 2);
      rippleEdge(phase, reveal * (settings.idleRipple + settings.sweepRipple * rippleEnergy));
      ctx.globalAlpha = reveal;
      ctx.drawImage(brush, left, top, radius * 2, radius * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(missing, 0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    }
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const x = p.x * width, y = p.y * width;
      const sourceX = p.sourceX * width, sourceY = p.sourceY * width;
      // Dust under the cursor and pieces belonging to the revealed patch both return home.
      const assemblyTarget = reveal ? reveal * Math.max(
        brushWeight((x - left) * brushScale - 0.5, (y - top) * brushScale - 0.5),
        brushWeight((sourceX - left) * brushScale - 0.5, (sourceY - top) * brushScale - 0.5),
      ) : 0;
      p.velocity = (p.velocity + (assemblyTarget - p.assembly) * settings.spring * dt) * damping;
      p.assembly += p.velocity * dt;
      if (Math.abs(assemblyTarget - p.assembly) + Math.abs(p.velocity) > 0.0005) moving = true;
      else { p.assembly = assemblyTarget; p.velocity = 0; }
      const joined = Math.max(0, Math.min(1, p.assembly));
      let px = x + (sourceX - x) * joined, py = y + (sourceY - y) * joined;
      if (reveal > 0 && joined < 1) {
        // Let loose shards curl along the rim as successive sections gather and release.
        const dx = px - focusX, dy = py - focusY;
        const distance = Math.hypot(dx, dy);
        const band = 1 - Math.abs(distance / radius - 0.78) / 0.29;
        if (band > 0) {
          const angle = Math.atan2(dy, dx);
          const crest = angle * 3 + phase;
          const drift = reveal * (1 - joined) * band * band * radius * settings.edgeDrift * (1 + rippleEnergy);
          const radial = Math.sin(crest) * drift;
          const tangent = Math.cos(crest) * drift * 0.85;
          px += (dx * radial - dy * tangent) / distance;
          py += (dy * radial + dx * tangent) / distance;
        }
      }
      ctx.fillStyle = p.colour;
      ctx.globalAlpha = 1 - joined;
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
      art.dataset.dispersionReady = "";
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
    if (!hovering && reveal < 0.01) { focusX = cursorX; focusY = cursorY; }
    hovering = true;
    schedule();
  }
  function reset() { hovering = false; schedule(); }
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
      delete art.dataset.dispersionReady;
      image.style.removeProperty("mask-image");
      ctx.clearRect(0, 0, width, height);
    },
  };
}
