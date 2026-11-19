type Point = { x: number; y: number };
type Stroke = { points: Point[]; shade: boolean; width: number; duration: number };

// These contours are fitted to the 640 x 827 homepage sketch.
const contours = [
  "M141 357 Q112 230 162 135 Q188 77 249 77 Q286 31 355 51 Q427 36 466 103 Q520 168 503 346",
  "M148 344 Q159 422 176 464 Q199 553 271 581 Q319 608 374 580 Q449 548 472 461 Q491 422 496 353",
  "M193 318 Q230 288 278 312 M356 312 Q404 286 447 321",
  "M202 351 Q244 323 279 349 Q242 376 202 351",
  "M234 344 Q232 357 244 358 Q256 356 252 343",
  "M355 350 Q397 321 432 350 Q397 375 355 350",
  "M384 344 Q383 357 395 358 Q407 355 403 343",
  "M301 354 Q301 393 279 423 Q277 438 301 436 Q317 446 336 436 Q351 429 362 436",
  "M264 485 Q297 469 318 477 Q337 469 375 483 Q321 510 264 485",
  "M197 534 L191 604 Q121 635 45 653 L18 689",
  "M462 532 L474 603 Q557 632 617 658",
  "M189 611 L131 653 L166 679 L115 705 L189 794",
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
    strokes.push({ points, shade: false, width: 1.6, duration: length * 0.72 });
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
    strokes.push({ points, shade: true, width: 44, duration: 410 });
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
  const lines = makeLayer(), mask = makeLayer();
  const strokes = pencilStrokes();
  const art = canvas.parentElement!;
  let index = 0, step = 0, elapsed = 0, last = 0, frame = 0, finished = false;

  function drawPencil(p: Point, opacity: number) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.84);
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
    while (index < strokes.length) {
      const stroke = strokes[index];
      const end = Math.min(1, elapsed / stroke.duration) * (stroke.points.length - 1);
      const layer = stroke.shade ? mask : lines;
      layer.strokeStyle = stroke.shade ? "white" : "rgba(59,55,52,.55)";
      layer.lineWidth = stroke.width;
      layer.lineCap = layer.lineJoin = "round";
      if (stroke.shade) layer.filter = "blur(6px)";
      const start = stroke.points[Math.floor(step)];
      layer.beginPath();
      layer.moveTo(start.x, start.y);
      for (let i = Math.floor(step) + 1; i <= end; i++) layer.lineTo(stroke.points[i].x, stroke.points[i].y);
      const lo = Math.floor(end), hi = Math.min(lo + 1, stroke.points.length - 1);
      const a = stroke.points[lo], b = stroke.points[hi];
      tip = { x: a.x + (b.x - a.x) * (end - lo), y: a.y + (b.y - a.y) * (end - lo) };
      layer.lineTo(tip.x, tip.y);
      layer.stroke();
      if (!stroke.shade) {
        // Pick up the actual graphite grain beneath each contour as the tip passes.
        mask.filter = "blur(2px)";
        mask.strokeStyle = "white";
        mask.lineWidth = 13;
        mask.lineCap = mask.lineJoin = "round";
        mask.beginPath();
        mask.moveTo(start.x, start.y);
        for (let i = Math.floor(step) + 1; i <= end; i++) mask.lineTo(stroke.points[i].x, stroke.points[i].y);
        mask.lineTo(tip.x, tip.y);
        mask.stroke();
      }
      step = end;
      if (elapsed < stroke.duration) break;
      elapsed -= stroke.duration; index++; step = 0;
    }
    const finish = index === strokes.length ? Math.min(1, elapsed / 480) : 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mask.canvas, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = (1 - finish) * (index < contours.length ? 1 : 0.55);
    ctx.drawImage(lines.canvas, 0, 0);
    ctx.globalAlpha = 1;
    if (finish) {
      ctx.globalAlpha = finish; ctx.drawImage(image, 0, 0); ctx.globalAlpha = 1;
    }
    if (!tip && finish) {
      const points = strokes[strokes.length - 1].points;
      const end = points[points.length - 1];
      tip = { x: end.x + finish * 12, y: end.y - finish * 18 };
    }
    if (tip) drawPencil(tip, 1 - finish);
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
