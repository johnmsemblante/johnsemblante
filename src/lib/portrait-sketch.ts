type Point = { x: number; y: number };
type Stroke = { points: Point[]; shade: boolean; width: number; duration: number };

// Guide the tip through local features. The visible marks come from the source artwork.
const contours = [
  "M197 316 Q229 292 277 312 Q248 300 214 315",
  "M203 352 Q244 327 278 350 Q245 370 208 354 M233 344 Q238 363 251 348",
  "M141 342 Q136 285 154 232 Q171 188 200 170 M156 242 Q172 198 218 166",
  "M148 352 Q138 390 166 428 M165 417 Q173 463 193 495",
  "M287 320 Q301 350 292 393 Q289 412 279 425 Q280 440 307 435",
  "M192 493 Q206 534 259 561 M242 553 Q310 599 370 572",
  "M356 314 Q391 291 439 317 Q401 300 371 315",
  "M355 350 Q395 328 431 349 Q397 372 358 352 M384 344 Q392 362 402 346",
  "M407 112 Q459 106 478 169 Q502 220 492 281 M466 160 Q488 191 494 234",
  "M348 359 Q341 396 355 421 Q371 443 344 434 Q329 441 313 439",
  "M261 486 Q292 470 317 478 Q346 471 376 485 Q323 503 282 491",
  "M373 571 Q430 547 459 496 M456 501 Q487 453 494 373",
  "M180 173 Q193 123 248 106 Q271 101 293 115 M227 117 Q255 68 310 79",
  "M283 83 Q318 42 359 62 Q396 72 412 107 M340 83 Q382 61 424 117",
  "M197 534 L191 604 Q121 635 45 653 L18 689",
  "M189 611 L131 653 L166 679 L115 705 L189 794",
  "M462 532 L474 603 Q557 632 617 658",
  "M470 611 L529 650 L498 678 L546 700 L475 796",
  "M225 660 Q278 769 409 703",
];

function pencilStrokes(): Stroke[] {
  const strokes: Stroke[] = [];
  function trace(d: string) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    const length = path.getTotalLength();
    const points = Array.from({ length: Math.ceil(length / 4) + 1 }, (_, i) => path.getPointAtLength(Math.min(i * 4, length)));
    strokes.push({ points, shade: false, width: 35, duration: Math.max(75, length * 1.15) });
  }
  for (const contour of contours) {
    for (const segment of contour.split(/ (?=M)/)) trace(segment);
  }
  // Overlapping local hatch passes follow the masses of hair, skin and clothing.
  const regions = [
    [314, 151, 185, 108, -0.23], [163, 240, 37, 120, 0.14], [465, 232, 44, 115, -0.1],
    [317, 291, 162, 91, 0.06], [239, 393, 90, 108, -0.3], [394, 397, 90, 110, 0.3],
    [320, 501, 136, 90, -0.13], [321, 622, 126, 109, 0.12],
    [149, 699, 156, 89, -0.3], [479, 702, 145, 88, 0.29], [311, 751, 145, 69, -0.1],
  ];
  for (const [cx, cy, rx, ry, tilt] of regions) {
    const points: Point[] = [];
    for (let row = 0; row <= 10; row++) {
      const v = row / 5 - 1;
      const span = rx * Math.sqrt(Math.max(0.04, 1 - v * v));
      for (let step = 0; step <= 12; step++) {
        const u = ((row % 2 ? 12 - step : step) / 6 - 1) * span;
        points.push({ x: cx + u, y: cy + v * ry + u * tilt + 2.2 * Math.sin(step + row) });
      }
    }
    strokes.push({ points, shade: true, width: 44, duration: 540 });
  }
  return strokes;
}

export function createPortraitSketch(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const ctx = context;
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const makeLayer = () => {
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    return layer.getContext("2d")!;
  };
  const lines = makeLayer(), mask = makeLayer(), graphite = makeLayer();
  // Compare each pixel to the surrounding tone to isolate the real pencil grain.
  graphite.fillStyle = "white";
  graphite.fillRect(0, 0, canvas.width, canvas.height);
  graphite.filter = "blur(5px)";
  graphite.drawImage(image, 0, 0);
  const localTone = graphite.getImageData(0, 0, canvas.width, canvas.height).data;
  graphite.filter = "none";
  graphite.clearRect(0, 0, canvas.width, canvas.height);
  graphite.drawImage(image, 0, 0);
  const marks = graphite.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < marks.data.length; i += 4) {
    const tone = marks.data[i + 1];
    const pressure = Math.max(0, localTone[i + 1] - tone) * 3 + (255 - tone) * 0.23;
    marks.data[i + 3] *= Math.min(1, pressure / 180);
  }
  graphite.putImageData(marks, 0, 0);
  const shadeComposite = makeLayer();
  const strokes = pencilStrokes();
  const art = canvas.parentElement!;
  let index = 0, step = 0, elapsed = 0, last = 0, frame = 0, finished = false;

  function drawPencil(p: Point, opacity: number, lift: number) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.84 - lift * 0.12);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#bb946c";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(17, -4); ctx.lineTo(17, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#282824";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(5, -1.4); ctx.lineTo(5, 1.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#475046"; ctx.fillRect(17, -4, 76, 8);
    ctx.fillStyle = "#75806d"; ctx.fillRect(17, -3, 76, 2);
    ctx.fillStyle = "#a8aaa0"; ctx.fillRect(93, -4, 8, 8);
    ctx.fillStyle = "#b78878"; ctx.fillRect(101, -3.8, 6, 7.6);
    ctx.restore();
  }

  function draw(time: number) {
    frame = 0;
    elapsed += last ? Math.min(time - last, 64) : 0;
    last = time;
    let tip: Point | undefined;
    let lift = 0;
    while (index < strokes.length) {
      const stroke = strokes[index];
      const previous = index ? strokes[index - 1].points : undefined;
      const from = previous?.[previous.length - 1], to = stroke.points[0];
      const travel = from ? Math.min(210, Math.hypot(to.x - from.x, to.y - from.y) * 0.53) : 0;
      if (from && elapsed < travel) {
        const t = elapsed / travel;
        const ease = t * t * (3 - 2 * t);
        lift = Math.sin(Math.PI * t);
        tip = { x: from.x + (to.x - from.x) * ease, y: from.y + (to.y - from.y) * ease - 12 * lift };
        break;
      }
      const progress = Math.min(1, (elapsed - travel) / stroke.duration);
      // Ease into contact and ease pressure at the end of each pass.
      const end = (progress - 0.65 * Math.sin(2 * Math.PI * progress) / (2 * Math.PI)) * (stroke.points.length - 1);
      const layer = stroke.shade ? mask : lines;
      layer.strokeStyle = "white";
      layer.lineWidth = stroke.width;
      layer.lineCap = layer.lineJoin = "round";
      layer.filter = stroke.shade ? "blur(6px)" : "blur(4px)";
      const start = stroke.points[Math.floor(step)];
      layer.beginPath();
      layer.moveTo(start.x, start.y);
      for (let i = Math.floor(step) + 1; i <= end; i++) layer.lineTo(stroke.points[i].x, stroke.points[i].y);
      const lo = Math.floor(end), hi = Math.min(lo + 1, stroke.points.length - 1);
      const a = stroke.points[lo], b = stroke.points[hi];
      tip = { x: a.x + (b.x - a.x) * (end - lo), y: a.y + (b.y - a.y) * (end - lo) };
      layer.lineTo(tip.x, tip.y);
      layer.stroke();
      step = end;
      if (elapsed < travel + stroke.duration) break;
      elapsed -= travel + stroke.duration; index++; step = 0;
    }
    const finish = index === strokes.length ? Math.min(1, elapsed / 480) : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(lines.canvas, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(graphite.canvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    // Composite the shaded artwork above the faint construction drawing.
    const shading = shadeComposite;
    shading.clearRect(0, 0, canvas.width, canvas.height);
    shading.drawImage(mask.canvas, 0, 0);
    shading.globalCompositeOperation = "source-in";
    shading.drawImage(image, 0, 0);
    shading.globalCompositeOperation = "source-over";
    ctx.drawImage(shading.canvas, 0, 0);
    if (finish) {
      ctx.globalAlpha = finish; ctx.drawImage(image, 0, 0); ctx.globalAlpha = 1;
    }
    if (!tip && finish) {
      const points = strokes[strokes.length - 1].points;
      const end = points[points.length - 1];
      tip = { x: end.x + finish * 12, y: end.y - finish * 18 };
    }
    if (tip) drawPencil(tip, 1 - finish, lift);
    if (finish === 1) {
      finished = true;
      art.removeAttribute("data-drawing");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else frame = requestAnimationFrame(draw);
  }

  art.setAttribute("data-sketch-ready", "");
  art.setAttribute("data-drawing", "");
  return {
    setActive(active: boolean) {
      if (!active) { cancelAnimationFrame(frame); frame = last = 0; }
      else if (!finished && !frame) frame = requestAnimationFrame(draw);
    },
    dispose() {
      cancelAnimationFrame(frame);
      art.removeAttribute("data-drawing");
      art.removeAttribute("data-sketch-ready");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
