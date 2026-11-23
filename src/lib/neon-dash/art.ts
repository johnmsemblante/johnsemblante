import { bounds, rules, type Run } from "./engine";
import { cosmetics, newPlayer, type Player } from "./progression";

function cityLayer(index: number) {
  const tile = document.createElement("canvas");
  tile.width = rules.width;
  tile.height = rules.height;
  const ctx = tile.getContext("2d")!;
  let seed = 75 + index;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let x = 0; x < tile.width;) {
    const width = 24 + random() * (38 + index * 16);
    const y = 284 - random() * (74 + index * 51);
    ctx.fillStyle = ["#21194c", "#131735", "#101026"][index];
    ctx.fillRect(x, y, width, 400 - y);
    ctx.fillRect(x + 5, y - 7, width - 10, 8);
    ctx.fillRect(x + width * .65, y - 18, 2, 18);
    for (let row = y + 13; row < 357; row += 12) {
      for (let column = x + 6; column < x + width - 7; column += 8) {
        if (random() < .5) continue;
        ctx.fillStyle = random() < .2 ? "#c32c85" : index === 2 ? "#226483" : "#343173";
        ctx.fillRect(column, row, index === 2 ? 5 : 3, 3);
      }
    }
    if (index === 2 && random() > .55) {
      ctx.fillStyle = "#bb247a";
      ctx.fillRect(x + 4, y + 30, 15, 43);
      ctx.fillStyle = "#ffc4f4";
      ctx.font = "bold 10px monospace";
      ["N", "E", "O"].forEach((letter, position) => ctx.fillText(letter, x + 8, y + 42 + position * 12));
    }
    x += width + 5 + random() * 13;
  }
  return tile;
}

export function buildRenderer(ctx: CanvasRenderingContext2D) {
  const layers = [0, 1, 2].map(cityLayer);
  const sky = ctx.createLinearGradient(0, 0, 0, rules.floor);
  sky.addColorStop(0, "#080d29");
  sky.addColorStop(.56, "#261955");
  sky.addColorStop(1, "#a73076");
  const rect = (color: string, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
  };
  function limb(points: number[][], color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  }
  const defaults = newPlayer().equipped;
  return (run: Run, moving: boolean, reduced: boolean, equipped: Player["equipped"] = defaults) => {
    const skin = cosmetics.skins.find(item => item.id === equipped.skins) ?? cosmetics.skins[0];
    const trail = cosmetics.trails.find(item => item.id === equipped.trails) ?? cosmetics.trails[0];
    const [armor, accent, visor] = skin.colors;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, rules.width, rules.height);
    for (let index = 0; index < 58; index++) rect(index % 9 ? "#66629b" : "#a5e7ff", index * 97 % 800, 13 + index * 31 % 154, index % 9 ? 1 : 2, 2);
    ctx.fillStyle = "#f38e9b";
    ctx.beginPath();
    ctx.arc(606, 135, 66, 0, Math.PI * 2);
    ctx.fill();
    for (let line = 143; line < 200; line += 9) rect("#492257", 542, line, 128, 3);
    layers.forEach((layer, index) => {
      const offset = reduced ? 0 : run.distance * [.13, .29, .53][index] % rules.width;
      ctx.drawImage(layer, -offset, 0);
      ctx.drawImage(layer, rules.width - offset, 0);
    });
    rect("#252044", 0, rules.floor, 800, 78);
    rect("#12b7dc", 0, rules.floor, 800, 3);
    rect("#a9f9ff", 0, rules.floor, 800, 1);
    rect("#120f2a", 0, rules.floor + 7, 800, 11);
    for (let x = -(run.distance % 70); x < 800; x += 70) {
      rect("#522c67", x, 348, 56, 19);
      rect("#de397c", x + 5, 353, 30, 2);
      rect("#392851", x, 373, 61, 3);
    }
    for (const token of run.tokens) {
      if (token.taken) continue;
      const radius = reduced ? 7 : 4 + Math.abs(Math.sin(run.time * 8 + token.x * .01)) * 4;
      ctx.fillStyle = "#ffb53835";
      ctx.beginPath(); ctx.ellipse(token.x, token.y, radius + 5, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffc947";
      ctx.beginPath(); ctx.ellipse(token.x, token.y, radius, 9, 0, 0, Math.PI * 2); ctx.fill();
      rect("#fff4b5", token.x - 1, token.y - 5, 2, 9);
    }
    for (const hazard of run.hazards) {
      const box = bounds(hazard, run.time);
      const color = hazard.kind === 2 ? "#ff64de" : hazard.kind === 3 ? "#b698ff" : "#ff6279";
      rect(color, hazard.x, box.y, box.width, box.height);
      rect("#27152d", hazard.x + 3, box.y + 3, box.width - 6, box.height - 6);
      rect(color, hazard.x + 4, box.y + (hazard.kind === 2 ? box.height - 5 : 7), box.width - 8, 2);
      for (let offset = 8; offset < box.width - 5; offset += 11) rect(color, hazard.x + offset, box.y + 13, 4, 5);
    }
    if (!reduced && run.burst > 0) for (let index = 0; index < 7; index++) {
      const spread = (0.25 - run.burst) * 160;
      rect("#71f7ed", run.burstX + Math.cos(index) * spread, run.burstY - Math.abs(Math.sin(index)) * spread, 3, 2);
    }
    ctx.save();
    ctx.translate(rules.playerX, rules.floor - run.lift);
    if (run.dead) { ctx.rotate(-.28); ctx.globalAlpha = .72; }
    if (!reduced && moving) {
      for (let index = 1; index < 6; index++) {
        const pulse = Math.sin(run.time * 8 - index);
        ctx.globalAlpha *= .72;
        const height = trail.id === "pulse" ? 3 + pulse * 2 : 2;
        rect(trail.colors[0], -index * 10 - 16, -18 + (trail.id === "sparks" ? pulse * 10 : index * -.7), trail.id === "streak" ? 14 : trail.id === "sparks" ? 4 : 9, height);
      }
      ctx.globalAlpha = run.dead ? .72 : 1;
    }
    const stride = moving && !run.lift ? Math.sin(run.time * 17) * 12 : 0;
    const torso = run.slide ? -14 : -32;
    const front = run.slide ? 24 : run.lift ? (run.velocity > 0 ? 11 : 4) : stride;
    limb([[-5, torso + 6], [-8, -13], [-front - 8, -3]], "#554698", 8);
    limb([[0, torso + 5], [front * .8 + 4, -13], [front, -3]], "#8879e0", 8);
    limb([[front - 2, -3], [front + 6, -3]], "#71f6e4", 5);
    limb([[-7, torso], [-16 - stride * .4, torso + 9]], "#da4187", 7);
    limb([[-5, torso + 7], [2, torso - 3]], armor, 14);
    limb([[3, torso - 2], [10, torso + 5], [16 + stride * .35, torso]], accent, 6);
    rect("#161632", 0, torso - 22, 20, 15);
    rect(visor, 3, torso - 20, 16, skin.id === "ninja" ? 3 : 6);
    rect(accent, 1, torso - 24, 13, 3);
    if (skin.id === "shadow") limb([[-5, torso - 14], [1, torso - 27], [17, torso - 27]], accent, 4);
    if (skin.id === "ninja") limb([[1, torso - 20], [-8, torso - 19], [-19, torso - 15 + stride * .15]], accent, 3);
    if (skin.id === "phantom") for (let index = 0; index < 3; index++) rect(accent, -9 + index * 10, torso - 25 + index * 8, 4, 2);
    if (skin.id === "gold") limb([[1, torso - 25], [5, torso - 31], [10, torso - 25], [16, torso - 31]], visor, 3);
    rect("#fa8ab4", -12, torso - 1, 3, 10);
    ctx.restore();
  };
}
