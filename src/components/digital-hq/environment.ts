import * as T from "three";
import { AssetBuilder, canvasTexture, disposeObject } from "./assets";
import { hqObjects, type SectionId } from "./objects";
import { buildBackgroundDetails, leaf } from "./background";

export async function buildEnvironment(signal?: AbortSignal) {
  const root = new T.Group();
  async function checkpoint() {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    if (signal?.aborted) { disposeObject(root); throw new DOMException("Scene loading cancelled", "AbortError"); }
  }
  let seed = 18733;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const mat = (color: string, extra: T.MeshStandardMaterialParameters = {}) => new T.MeshStandardMaterial({ color, roughness: .6, ...extra });
  const m = {
    wall: mat("#22253e"), floor: mat("#303149"), black: mat("#101220"), trim: mat("#36354f", { metalness: .65, roughness: .35 }),
    wood: new T.MeshPhysicalMaterial({ color: "#ddd2c5", roughness: .45, clearcoat: .32, clearcoatRoughness: .42 }), walnut: mat("#462c2c"), leather: mat("#191c2c", { roughness: .88 }),
    silver: mat("#b2bdd1", { metalness: .8, roughness: .28 }), white: mat("#e5e4e6", { metalness: .15, roughness: .3 }),
    amber: mat("#ffc471", { emissive: "#ffab4f", emissiveIntensity: 2 }), cyan: mat("#83e5ef", { emissive: "#4cc9ef", emissiveIntensity: 1.3 }),
    purple: mat("#d298f1", { emissive: "#a953e5", emissiveIntensity: 1.4 }), red: mat("#e6655f"), teal: mat("#297986"), yellow: mat("#daaa58"),
    stem: mat("#364b38"), ceramic: mat("#c8b9ab"), soil: mat("#25262a"), blue: mat("#436aa0"),
  };
  const wood = canvasTexture(1024, 512, c => {
    const base = c.createLinearGradient(0, 0, 120, 512);
    base.addColorStop(0, "#a56d4a"); base.addColorStop(.54, "#ca8d62"); base.addColorStop(1, "#9d6242");
    c.fillStyle = base; c.fillRect(0, 0, 1024, 512);
    // Long growth bands show through the satin finish without repeating a tile.
    for (let i = 0; i < 22; i++) {
      const y = i * 24 + random() * 13;
      const band = c.createLinearGradient(0, y - 7, 0, y + 7);
      band.addColorStop(0, "#37201600"); band.addColorStop(.53, "#37201635"); band.addColorStop(1, "#37201600");
      c.fillStyle = band; c.fillRect(0, y - 7, 1024, 14);
    }
    for (let i = 0; i < 1100; i++) {
      const y = random() * 512, bow = (random() - .5) * 28;
      c.strokeStyle = random() > .55 ? "#64392345" : "#ffdbac45";
      c.lineWidth = .4 + random() * 1.3;
      c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(310, y + bow, 675, y - bow * .6, 1024, y + bow * .2); c.stroke();
    }
  });
  wood.anisotropy = 4;
  m.wood.map = wood;
  m.wood.bumpMap = wood;
  m.wood.bumpScale = .018;
  const screen = (kind: string) => {
    const map = canvasTexture(768, 480, c => {
      const g = c.createLinearGradient(0, 0, 768, 480); g.addColorStop(0, "#111a35"); g.addColorStop(1, "#302343"); c.fillStyle = g; c.fillRect(0, 0, 768, 480);
      if (kind === "code") {
        c.fillStyle = "#242b45"; c.fillRect(0, 0, 768, 34); c.fillStyle = "#0d1427"; c.fillRect(0, 34, 130, 446);
        c.font = "14px monospace"; c.fillStyle = "#a9bad1"; c.fillText("portfolio.tsx", 160, 23);
        const code = ["const developer = {", "  name: 'John Semblante',", "  basedIn: 'Cebu, Philippines',", "  focus: ['design', 'development'],", "  buildingSince: 2013", "};", "", "export function DigitalHQ() {", "  return (", "    <Workspace>", "      <Ideas />", "      <Experiments />", "      <ThingsWorthMaking />", "    </Workspace>", "  );", "}"];
        c.font = "18px monospace"; code.forEach((line, i) => { c.fillStyle = ["#bca1e5", "#86cfdd", "#e9bc85"][i % 3]; c.fillText(line, 153, 72 + i * 23); });
        for (let i = 0; i < 13; i++) { c.fillStyle = "#57617c"; c.fillRect(19, 64 + i * 22, 45 + random() * 40, 4); }
      } else if (kind === "arcade") {
        c.fillStyle = "#55266a"; c.fillRect(0, 200, 768, 280);
        for (let i = 0; i < 25; i++) { const h = 50 + random() * 210; c.fillStyle = i % 2 ? "#151d3c" : "#28345d"; c.fillRect(i * 33, 395 - h, 28, h); c.fillStyle = "#b574d6"; for (let y = 0; y < h - 10; y += 26) c.fillRect(i * 33 + 7, 405 - h + y, 5, 10); }
        c.strokeStyle = "#74e1f2"; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 400); c.lineTo(768, 400); c.stroke();
        c.fillStyle = "#f1c19a"; c.fillRect(317, 309, 29, 29); c.fillStyle = "#e77287"; c.fillRect(304, 337, 35, 40); c.fillStyle = "#7de8ef"; c.fillRect(301, 377, 12, 22); c.fillRect(332, 372, 28, 12);
        c.font = "bold italic 72px sans-serif"; c.fillStyle = "#f5e9ff"; c.textAlign = "center"; c.fillText("NEON DASH", 384, 117); c.font = "20px monospace"; c.fillStyle = "#a4e9f1"; c.fillText("A LITTLE SIDE QUEST", 384, 158);
      } else if (kind === "phone") {
        c.strokeStyle = "#a6ccff"; c.lineWidth = 12; c.strokeRect(234, 110, 300, 190); c.beginPath(); c.moveTo(234, 110); c.lineTo(384, 230); c.lineTo(534, 110); c.stroke(); c.font = "30px sans-serif"; c.fillStyle = "#f7ecff"; c.textAlign = "center"; c.fillText("LET’S TALK", 384, 385);
      } else {
        c.font = "24px sans-serif"; c.fillStyle = "#c5b7e6"; c.fillText("MADE FOR THE WEB", 38, 54); c.fillStyle = "#84dbe9"; c.font = "bold 61px sans-serif"; c.fillText("Ideas into things.", 38, 132);
        for (let i = 0; i < 3; i++) { c.fillStyle = ["#465984", "#76518b", "#3f757c"][i]; c.fillRect(38 + i * 244, 179, 211, 153); c.fillStyle = "#b9c9dc"; c.fillRect(38 + i * 244, 359, 165, 9); c.fillStyle = "#65718d"; c.fillRect(38 + i * 244, 385, 131, 6); }
      }
    });
    return mat("#ffffff", { map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: .65, roughness: .4 });
  };
  const screens = { code: screen("code"), work: screen("work"), arcade: screen("arcade"), phone: screen("phone") };
  function printedMark(text: string, ink: string, background?: string) {
    const map = canvasTexture(512, 192, c => {
      if (background) { c.fillStyle = background; c.fillRect(0, 0, 512, 192); }
      c.font = text.length > 4 ? "italic bold 76px sans-serif" : "bold 148px sans-serif";
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = ink;
      c.fillText(text, 256, 98, 475);
    });
    return new T.MeshBasicMaterial({ map, transparent: !background, alphaTest: .08, toneMapped: false });
  }
  const monogram = printedMark("js.", "#dfd5ed");
  await checkpoint();
  const foliage = canvasTexture(96, 192, c => {
    const color = c.createLinearGradient(0, 0, 96, 0);
    color.addColorStop(0, "#48632a"); color.addColorStop(.53, "#a0ae58"); color.addColorStop(1, "#335029");
    c.fillStyle = color; c.fillRect(0, 0, 96, 192);
    c.strokeStyle = "#c3bf7c85"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(48, 0); c.lineTo(48, 192); c.stroke();
    c.strokeStyle = "#d0d09350"; c.lineWidth = .8;
    for (let y = 18; y < 182; y += 17) {
      for (const side of [-1, 1]) {
        c.beginPath(); c.moveTo(48, y); c.quadraticCurveTo(48 + 21 * side, y - 8, 48 + 46 * side, y - 17); c.stroke();
      }
    }
  });
  const foliageGreen = mat("#b4ce90", { map: foliage, side: T.DoubleSide, roughness: .55 });
  const foliageYoung = mat("#bdc088", { map: foliage, side: T.DoubleSide, roughness: .48 });
  function plant(a: AssetBuilder, x: number, y: number, z: number, scale = 1) {
    a.cylinder(x, y + .245 * scale, z, .26 * scale, .185 * scale, .49 * scale, m.ceramic);
    a.cylinder(x, y + .05 * scale, z, .207 * scale, .215 * scale, .08 * scale, m.ceramic);
    a.cylinder(x, y + .491 * scale, z, .245 * scale, .245 * scale, .021 * scale, m.soil);
    a.add(new T.TorusGeometry(.251 * scale, .017 * scale, 8, 24), m.ceramic, [x, y + .498 * scale, z], [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 13; i++) {
      const angle = i * 2.399, height = (.24 + random() * .62) * scale;
      const dx = Math.sin(angle) * height * .46, dz = Math.cos(angle) * height * .46;
      const top = y + .5 * scale + height;
      a.tube([[x, y + .47 * scale, z], [x + dx * .4, top - height * .42, z + dz * .4], [x + dx, top, z + dz]], .011 * scale, m.stem, 7);
      a.add(leaf((.44 + random() * .35) * scale, (.105 + random() * .09) * scale), i % 3 ? foliageGreen : foliageYoung, [x + dx, top, z + dz], [.45 + random() * .58, angle, (random() - .5) * .34]);
    }
  }
  const architecture = new AssetBuilder(m);
  // Elliptical architectural platform with a warm inset light and metal reveals.
  for (const [y, r, h, material] of [[-.16, 9.4, .36, m.black], [.04, 9.25, .07, m.amber], [.16, 9.3, .18, m.trim], [.28, 9.2, .12, m.wall]] as const) {
    const g = new T.CylinderGeometry(r, r, h, 96); g.scale(1, 1, .65); architecture.add(g, material, [0, y, 0]);
  }
  plant(architecture, -8.8, .35, -3.7, 2.1); plant(architecture, 8.7, .35, -4, 1.7);

  root.add(buildBackgroundDetails());
  root.add(architecture.finish());
  await checkpoint();
  const desk = new AssetBuilder(m);
  const desktopFinish = m.wood.clone();
  // The desktop, dark edge band and warm reveal share the same curved outline.
  const outline = new T.Shape();
  outline.moveTo(-6.25, .75);
  outline.bezierCurveTo(-3.8, 1.2, 3.8, 1.2, 6.25, .75);
  outline.bezierCurveTo(7.2, -.15, 7.05, -2.2, 5.65, -2.98);
  outline.bezierCurveTo(3.4, -4.03, -3.4, -4.03, -5.65, -2.98);
  outline.bezierCurveTo(-7.05, -2.2, -7.2, -.15, -6.25, .75);
  for (const [y, depth, bevel, material] of [[1.73, .29, .055, m.trim], [2.023, .039, .016, m.amber], [2.08, .24, .055, desktopFinish]] as const) {
    const slab = new T.ExtrudeGeometry(outline, { depth, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 20 });
    const { position, uv } = slab.attributes;
    for (const group of slab.groups) {
      for (let i = group.start; i < group.start + group.count; i++) {
        const grainY = group.materialIndex === 0 ? (position.getY(i) + 4) / 5.3 : .48 + position.getZ(i) * .14;
        uv.setXY(i, (position.getX(i) + 7) / 14, grainY);
      }
    }
    if (material === m.amber) slab.scale(1.021, 1.025, 1);
    slab.rotateX(-Math.PI / 2);
    desk.add(slab, material, [0, y, .62]);
  }
  // A curved tambour apron gives the desktop a substantial shadowed base.
  const apronPath: [number, number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const angle = (i / 48 - .5) * Math.PI * .83;
    const x = Math.sin(angle) * 5.24, z = 1.66 + Math.cos(angle) * 1.51;
    const slatWidth = Math.hypot(5.24 * Math.cos(angle), 1.51 * Math.sin(angle)) * Math.PI * .83 / 48;
    const yaw = Math.atan2(1.51 * Math.sin(angle), 5.24 * Math.cos(angle));
    const flute = new T.CylinderGeometry(1, 1, 1.27, 12);
    flute.scale(slatWidth * .5, 1, .095);
    desk.add(flute, m.walnut, [x, 1.13, z], [0, yaw, 0]);
    apronPath.push([x, .493, z]);
  }
  desk.tube(apronPath, .021, m.trim, 48);
  for (const x of [-4.8, 4.8]) {
    desk.box(x, 1.13, 1.55, .28, 1.68, 1.85, m.trim, .09);
    desk.box(x, .41, 1.55, .94, .12, 1.95, m.black);
  }
  desk.box(0, 2.394, 3.15, 3.55, .037, 1.18, m.walnut, .08);
  desk.box(0, 2.419, 3.15, 3.48, .022, 1.11, m.leather, .07);
  const graphite = mat("#272532", { metalness: .38, roughness: .37 });
  const brushedEdge = mat("#777489", { metalness: .6, roughness: .32 });
  const keycap = mat("#272631", { roughness: .53 });
  const keyAccent = mat("#544b72", { roughness: .51 });
  desk.box(-.35, 2.467, 3.14, 2.12, .083, .73, graphite, .038);
  desk.box(-.35, 2.502, 3.14, 2.05, .029, .67, m.black, .023);
  const keyRows = [Array(14).fill(1), [1.4, ...Array(12).fill(1), .6], [1.7, ...Array(11).fill(1), 1.3], [1.2, 1, 1, 5.6, 1.2, 1, 1, 1, 1]];
  const keyPitch = .136;
  for (const [row, widths] of keyRows.entries()) {
    let x = -1.302;
    for (const [index, width] of widths.entries()) {
      const length = width * keyPitch, z = 2.89 + row * .158;
      desk.box(x + length / 2, 2.526, z, length - .016, .025, .127, index % 3 === 0 ? m.purple : m.cyan, 0);
      desk.box(x + length / 2, 2.555, z, length - .022, .043, .114, index === 0 || width > 2 ? keyAccent : keycap, .011);
      x += length;
    }
    await checkpoint();
  }
  desk.sphere(1.15, 2.508, 3.12, .194, .103, .3, graphite, 24);
  desk.tube([[.977, 2.496, 3.02], [1.02, 2.48, 3.31], [1.15, 2.48, 3.41], [1.28, 2.48, 3.31], [1.323, 2.496, 3.02]], .009, m.purple, 20);
  desk.box(1.15, 2.598, 3.007, .044, .028, .097, m.black, .012);
  desk.box(1.15, 2.596, 2.943, .009, .008, .051, m.black, 0);
  desk.tube([[1.15, 2.49, 2.82], [1.3, 2.408, 2.59], [1.65, 2.408, 2.49], [1.9, 2.408, 2.5]], .01, m.black, 14);

  // Local +Z is the user's side of the hinge. Yaw points that side at the seat.
  const laptop = new AssetBuilder({});
  laptop.root.position.set(-.65, 2.376, 2.17);
  laptop.root.rotation.y = Math.atan2(.33, -1.89);
  const displayAngle = -.22, lidLength = 1.25;
  const lidMidY = .096 + Math.cos(displayAngle) * lidLength / 2;
  const lidMidZ = Math.sin(displayAngle) * lidLength / 2;
  const screenFace = new T.Vector3(0, -Math.sin(displayAngle), Math.cos(displayAngle));
  laptop.box(0, .058, .648, 2.58, .106, 1.37, graphite, .035);
  laptop.box(0, .103, .648, 2.553, .031, 1.341, brushedEdge, .014);
  laptop.box(0, lidMidY, lidMidZ, 2.57, lidLength, .062, graphite, .027, [displayAngle, 0, 0]);
  laptop.box(0, lidMidY - screenFace.y * .029, lidMidZ - screenFace.z * .029, 2.53, 1.21, .015, brushedEdge, .007, [displayAngle, 0, 0]);
  laptop.box(0, lidMidY - screenFace.y * .039, lidMidZ - screenFace.z * .039, 2.49, 1.17, .016, graphite, .008, [displayAngle, 0, 0]);
  laptop.add(new T.CylinderGeometry(.035, .035, 2.3, 12), graphite, [0, .103, .023], [0, 0, Math.PI / 2]);
  const display = mat("#202231", { roughness: .28 });
  const deck = mat("#3b384b", { roughness: .58 });
  const loadTexture = async (name: string, color = true) => {
    try {
      const texture = await new T.TextureLoader().loadAsync(`/images/digital-hq/materials/${name}.webp`);
      texture.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    } catch { return null; }
  };
  const [displayMap, deckMap, grain, roughness, normal] = await Promise.all([
    loadTexture("laptop-display"), loadTexture("laptop-deck"), loadTexture("table-color"),
    loadTexture("table-roughness", false), loadTexture("table-normal", false),
  ]);
  for (const texture of [grain, roughness, normal]) {
    if (!texture) continue;
    texture.wrapS = T.RepeatWrapping;
    texture.repeat.set(2.65, 1);
  }
  if (grain) { desktopFinish.map = grain; desktopFinish.color.set("#ffdfc7"); }
  desktopFinish.roughness = .78;
  desktopFinish.roughnessMap = roughness;
  desktopFinish.normalMap = normal;
  desktopFinish.normalScale.set(.33, .33);
  if (normal) desktopFinish.bumpMap = null;
  if (displayMap) {
    display.color.set("#ffffff"); display.map = displayMap;
    display.emissive.set("#ffffff"); display.emissiveMap = displayMap; display.emissiveIntensity = .42;
  }
  if (deckMap) { deck.color.set("#ffffff"); deck.map = deckMap; }
  laptop.box(0, lidMidY + screenFace.y * .035, lidMidZ + screenFace.z * .035, 2.515, 1.195, .013, m.black, .012, [displayAngle, 0, 0]);
  laptop.add(new T.PlaneGeometry(2.41, 1.075), display, [0, lidMidY + screenFace.y * .044, lidMidZ + screenFace.z * .044], [displayAngle, 0, 0]);
  laptop.add(new T.PlaneGeometry(2.42, 1.20), deck, [0, .121, .645], [-Math.PI / 2, 0, 0]);
  for (const [z, length] of [[.28, .15], [.49, .11], [.67, .08]]) {
    laptop.box(1.29, .061, z, .009, .032, length, m.black, .006);
  }
  laptop.box(-1.292, .056, .51, .01, .011, .071, m.cyan, .004);
  laptop.add(new T.PlaneGeometry(.79, .32), monogram, [0, lidMidY - screenFace.y * .051, lidMidZ - screenFace.z * .051], [displayAngle, Math.PI, 0]);
  root.add(laptop.finish());
  // Ceramic coffee mug and handle.
  const glaze = mat("#211a25", { roughness: .21 });
  desk.cylinder(1.8, 2.67, 1.9, .23, .196, .55, glaze);
  desk.cylinder(1.8, 2.948, 1.9, .205, .205, .014, m.walnut);
  desk.add(new T.TorusGeometry(.219, .021, 10, 32), glaze, [1.8, 2.952, 1.9], [Math.PI / 2, 0, 0]);
  desk.add(new T.TorusGeometry(.15, .038, 8, 24), glaze, [2.028, 2.69, 1.9]);
  desk.add(new T.PlaneGeometry(.29, .14), monogram, [1.8, 2.69, 2.132]);
  desk.cylinder(1.8, 2.391, 1.9, .29, .286, .027, m.walnut);
  const books = [
    ["Creative Tech", "#b77a3d"], ["WordPress", "#297d76"], ["Full-Stack", "#425d9c"],
    ["Frontend", "#754d9a"], ["UI / UX Design", "#b65d47"], ["Web Development", "#252e47"],
  ] as const;
  books.forEach(([title, color], i) => {
    const x = -3.58 + Math.sin(i * 2.2) * .08, y = 2.45 + i * .134, width = 1.48 - i * .05;
    const spine = canvasTexture(256, 32, c => {
      c.fillStyle = color; c.fillRect(0, 0, 256, 32);
      c.font = "bold 17px sans-serif"; c.fillStyle = "#fff1d9"; c.textAlign = "center"; c.fillText(title, 128, 22);
    });
    const cover = mat(color, { roughness: .56 });
    desk.box(x, y, 3.0, width, .098, .78, m.ceramic, .01);
    for (const edge of [-1, 1]) desk.box(x, y + edge * .055, 3.0, width + .04, .022, .83, cover, .008);
    desk.box(x, y, 3.418, width + .04, .121, .019, mat("#fffaf1", { map: spine }), .005);
  });
  // Camera body with a recessed glass lens and knurled grip.
  const glass = mat("#252d49", { metalness: .42, roughness: .16 });
  // A small color puzzle and notebook balance the denser hardware on the left.
  const puzzle = new AssetBuilder({});
  puzzle.root.position.set(4.57, 2.553, 2.98);
  puzzle.root.rotation.y = -.26;
  puzzle.box(0, 0, 0, .346, .346, .346, m.black, .017);
  const puzzleColors = [m.white, m.red, m.yellow, m.teal, m.blue];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) * .109, y = (row - 1) * .109;
      const front = puzzleColors[(row * 2 + col) % puzzleColors.length];
      const top = puzzleColors[(row + col * 2 + 1) % puzzleColors.length];
      puzzle.box(x, y, .176, .093, .093, .012, front, .005);
      puzzle.box(x, .176, y, .093, .012, .093, top, .005);
      puzzle.box(.176, y, x, .012, .093, .093, front, .005);
    }
  }
  root.add(puzzle.finish());
  desk.box(3.74, 2.394, 2.36, .69, .031, .92, m.ceramic, .012, [0, .15, 0]);
  desk.box(3.74, 2.419, 2.36, .72, .021, .94, graphite, .017, [0, .15, 0]);
  desk.add(new T.CylinderGeometry(.018, .018, .55, 10), brushedEdge, [3.94, 2.446, 2.31], [Math.PI / 2, 0, .08]);
  root.add(desk.finish());
  await checkpoint();
  const chair = new AssetBuilder(m);
  chair.cylinder(0, 1, -.6, .1, .1, 1.3, m.trim); chair.box(0, 1.75, -.45, 1.8, .32, 1.6, m.leather, .15);
  chair.box(0, 3.28, -1.15, 1.85, 2.75, .4, m.black, .18);
  chair.box(0, 3.18, -.91, 1.38, 1.85, .24, m.leather, .16);
  for (const side of [-1, 1]) {
    chair.box(side * .79, 3.42, -.84, .4, 1.83, .4, m.leather, .16, [0, side * -.24, side * -.13]);
    chair.tube([[side * .52, 2.36, -.741], [side * .56, 3.32, -.765], [side * .51, 4.04, -.785]], .014, m.walnut, 15);
  }
  chair.box(0, 4.55, -.98, 1.2, .5, .35, m.leather, .14);
  for (const side of [-1, 1]) { chair.tube([[side * .83, 1.8, -.5], [side * 1.02, 2.2, -.2], [side * 1.02, 2.65, .2]], .065, m.trim); chair.box(side * 1.02, 2.65, .1, .28, .13, .95, m.black); chair.tube([[side * .9, 2.3, -.9], [side * 1.05, 3.6, -1], [side * .65, 4.55, -.98]], .035, m.purple); }
  for (let i = 0; i < 5; i++) { const angle = i / 5 * Math.PI * 2; chair.tube([[0, .5, -.6], [Math.sin(angle), .35, Math.cos(angle) - .6]], .06, m.trim, 4); chair.sphere(Math.sin(angle), .3, Math.cos(angle) - .6, .12, .12, .12, m.black, 8); }
  chair.root.scale.setScalar(1.2); root.add(chair.finish());
  await checkpoint();
  const objects = new Map<SectionId, T.Group>();
  const moving = new Map<SectionId, T.Object3D>();
  for (const item of hqObjects) {
    if (item.id === "about") continue;
    const a = new AssetBuilder(m); a.root.position.set(item.position[0], item.position[1], item.position[2]); a.root.userData.section = item.id;
    if (item.id === "work") {
      const card = new T.Shape();
      card.moveTo(-.86,-1.23); card.lineTo(.85,-1.23); card.lineTo(.85,.99);
      card.lineTo(.55,1.29); card.lineTo(-.86,1.29); card.closePath();
      const housing = new T.ExtrudeGeometry(card,{depth:.16,bevelSize:.045,bevelThickness:.035,bevelSegments:3});
      a.add(housing, graphite, [0,1.3,-.1], [0,.15,-.15]);
      a.box(0, 1.2, .15, 1.51, 1.45, .045, m.walnut, .06, [0, .15, -.15]);
      for (let i = 0; i < 7; i++) a.box(-.66 + i * .22, 2.25, .16, .15, .4, .035, m.yellow, .012, [0, .15, -.15]);
      a.box(0, .09, .18, 1.52, .035, .024, m.amber, .006, [0, .15, -.15]);
      a.add(new T.PlaneGeometry(.95, .4), printedMark("</>", "#ffd295"), [0, 1.29, .302], [0, .15, -.15]);
      a.box(0, -.12, 0, 2.5, .18, 1.3, m.trim, .1);
    } else if (item.id === "skills") {
      for (const [x, z, material] of [[-.76, -.45, screens.code], [.98, -.66, screens.work]] as const) {
        const monitor = new AssetBuilder({});
        monitor.root.position.set(x, 0, z);
        monitor.root.rotation.y = Math.atan2(-.32 - (item.position[0] + x), .28 - (item.position[2] + z)) * .72;
        monitor.box(0, .062, 0, .76, .08, .52, graphite, .032);
        monitor.box(0, .47, -.13, .12, .83, .13, brushedEdge, .028);
        monitor.box(0, 1.12, -.12, 1.83, 1.13, .123, graphite, .031);
        monitor.box(0, 1.12, -.052, 1.783, 1.076, .015, m.black, .006);
        monitor.add(new T.PlaneGeometry(1.724, 1.007), material, [0, 1.129, -.042]);
        monitor.box(.72, .595, -.042, .054, .013, .008, m.cyan, .004);
        monitor.box(0, 1.05, -.185, .68, .45, .055, m.black, .025);
        a.root.add(monitor.finish());
      }
    } else if (item.id === "ventures") {
      a.box(0, -.19, -.14, 1.89, .13, 1.53, m.wood, .055);
      a.box(0, -.97, -.58, .22, 1.51, .28, m.trim, .04);
      a.cylinder(0, .02, 0, .83, .9, .16, m.trim); a.cylinder(0, .12, 0, .78, .78, .035, m.amber);
      const rocket = new AssetBuilder({});
      rocket.root.position.set(-.18, .33, 0);
      rocket.root.rotation.z = -.31;
      const hull = [[.135, 0], [.205, .14], [.326, .61], [.343, .89], [.303, 1.19], [.216, 1.48], [.086, 1.7], [.008, 1.81]];
      rocket.add(new T.LatheGeometry(hull.map(([r, y]) => new T.Vector2(r, y)), 40), m.white, [0, 0, 0]);
      rocket.add(new T.CylinderGeometry(.202, .146, .18, 32), brushedEdge, [0, -.02, 0]);
      rocket.add(new T.ConeGeometry(.12, .32, 24), m.amber, [0, -.22, 0], [Math.PI, 0, 0]);
      rocket.sphere(0, 1.02, .313, .118, .118, .045, glass, 24);
      rocket.add(new T.TorusGeometry(.141, .028, 10, 32), m.yellow, [0, 1.02, .327]);
      const fin = new T.Shape();
      fin.moveTo(.17, .12); fin.quadraticCurveTo(.43, .14, .52, -.14);
      fin.quadraticCurveTo(.59, .24, .307, .64); fin.lineTo(.17, .12);
      for (const angle of [0, 2.094, 4.189]) {
        const blade = new T.ExtrudeGeometry(fin, { depth: .045, bevelSize: .016, bevelThickness: .012, bevelSegments: 2, curveSegments: 10 });
        rocket.add(blade, m.red, [0, 0, 0], [0, angle, 0]);
      }
      a.root.add(rocket.finish());
      a.add(new T.TorusGeometry(.66, .017, 6, 36), m.amber, [0, .154, 0], [Math.PI / 2, 0, 0]);
    } else if (item.id === "blog") {
      a.box(0, 2.8, -.2, 3, 5.2, .16, m.walnut);
      for (const x of [-1.5, 1.5]) a.box(x, 2.8, 0, .14, 5.5, .85, m.wood);
      for (let row = 0; row < 5; row++) {
        const y = .4 + row * 1.16; a.box(0, y, .1, 3.1, .13, .9, m.wood); a.box(0, y + .08, .53, 2.92, .026, .025, m.amber);
        let x = -.41; while (x < 1.2) { const w = .12 + random() * .13, h = .58 + random() * .33; a.box(x, y + .11 + h / 2, .15, w, h, .43, [m.teal, m.red, m.yellow, m.blue, m.ceramic][Math.floor(random() * 5)], .012); a.box(x, y + .25, .38, w * .7, .022, .006, m.ceramic, 0); x += w + .06; }
        await checkpoint();
      }
      a.box(0, 6.14, 0, 3.14, .16, .95, m.wood, .055);
      plant(a, -.88, 6.22, 0, .53);
      const atlas = canvasTexture(512, 256, c => {
        c.fillStyle = "#234975"; c.fillRect(0, 0, 512, 256);
        c.strokeStyle = "#8faab1"; c.lineWidth = .7;
        for (let i = 0; i < 512; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); }
        for (let i = 0; i < 256; i += 32) { c.beginPath(); c.moveTo(0, i); c.lineTo(512, i); c.stroke(); }
        c.fillStyle = "#d5aa68";
        for (const coast of ["M34 55L74 38L130 48L155 69L118 88L106 108L84 105L68 82Z", "M113 111L150 119L163 140L135 186L124 202L120 161Z", "M207 86L246 79L268 103L254 141L236 165L217 128Z", "M213 72L227 42L265 52L304 37L383 44L444 72L403 89L391 116L364 92L340 124L322 93L293 83L253 74Z", "M387 150L424 137L451 158L438 178L395 176Z"]) c.fill(new Path2D(coast));
      });
      a.cylinder(.7, 6.255, 0, .27, .31, .068, m.yellow);
      a.sphere(.7, 6.66, 0, .34, .34, .34, mat("#fff2dc", { map: atlas, roughness: .36 })); a.add(new T.TorusGeometry(.375, .019, 8, 36), m.yellow, [.7, 6.66, 0], [0, 0, -.2]);
    } else if (item.id === "tools") {
      a.box(0, .35, 0, 1.95, .7, .9, graphite, .09);
      a.box(0, .75, -.33, 1.98, .16, .91, m.trim, .05, [-.65, 0, 0]);
      a.box(0, .655, .423, 1.84, .05, .072, brushedEdge, .016);
      for (const x of [-.873, .873]) {
        a.box(x, .43, .463, .074, .38, .037, m.black, .018);
        for (const y of [.275, .566]) a.add(new T.CylinderGeometry(.014, .014, .013, 10), m.silver, [x, y, .488], [Math.PI / 2, 0, 0]);
      }
      for (const x of [-.65, .65]) { a.box(x, .36, .47, .15, .25, .04, m.silver); a.box(x, .37, .5, .06, .12, .02, m.walnut); }
      for (let i = 0; i < 6; i++) { const x = -.7 + i * .28; a.box(x, .95, 0, .07, .68, .07, i % 2 ? m.yellow : m.silver, .02, [0, 0, (i - 2.5) * .1]); a.add(new T.TorusGeometry(.11, .035, 8, 14, Math.PI * 1.5), m.silver, [x, 1.3, 0]); }
      a.tube([[-.35, .65, .46], [-.35, .8, .46], [.35, .8, .46], [.35, .65, .46]], .045, m.silver, 10);
    } else if (item.id === "arcade") {
      a.box(0, 1.2, 0, 1.65, 2.1, 1.25, m.black, .1);
      // Profile in depth/height coordinates: toe kick, control shelf, recessed
      // screen and projecting marquee are a continuous cabinet side panel.
      const profile = [[-.82,.12],[.60,.12],[.64,1.81],[.99,2.02],[.99,2.22],[.40,2.44],[.14,3.72],[.72,3.92],[.72,4.39],[-.78,4.39]];
      const sidePanel = new T.Shape(profile.map(([z,y]) => new T.Vector2(-z,y)));
      for (const x of [-.90,.79]) {
        const side = new T.ExtrudeGeometry(sidePanel, {depth:.11,bevelSize:.038,bevelThickness:.026,bevelSegments:3});
        a.add(side, graphite, [x,0,0], [0,Math.PI/2,0]);
        const strip = profile.slice(1,9);
        for (let j=1;j<strip.length;j++) {
          const outer = x < 0 ? x-.024 : x+.136;
          a.tube([[outer,strip[j-1][1],strip[j-1][0]],[outer,strip[j][1],strip[j][0]]],.019,m.purple,2);
        }
      }
      a.box(0, 3.1, .08, 1.64, 1.5, .12, m.trim, .04, [-.18, 0, 0]); a.box(0, 3.1, .16, 1.47, 1.3, .01, screens.arcade, .01, [-.18, 0, 0]);
      a.box(0, 4.15, -.03, 1.95, .55, 1.5, m.black, .07); a.add(new T.PlaneGeometry(1.7, .39), printedMark("NEON DASH", "#e8dcff", "#4c197e"), [0, 4.15, .74]);
      for (const y of [3.929, 4.371]) a.box(0, y, .739, 1.82, .025, .027, m.purple, .008);
      a.box(0, 2.1, .64, 1.9, .17, .78, m.trim); a.cylinder(-.48, 2.34, .68, .03, .03, .35, m.silver); a.sphere(-.48, 2.53, .68, .12, .12, .12, m.red);
      for (let i = 0; i < 4; i++) a.cylinder(.1 + (i % 2) * .3, 2.23, .57 + Math.floor(i / 2) * .25, .09, .09, .05, i % 2 ? m.yellow : m.cyan, 16);
      a.box(0, 1.15, .66, .5, .25, .02, m.trim);
      a.box(0, 1.18, .68, .24, .04, .02, m.black);
      for (const x of [-.55, .55]) {
        a.box(x, 1.79, .655, .23, .176, .022, graphite, .023);
        for (let row = 0; row < 3; row++) a.box(x, 1.744 + row * .041, .67, .15, .012, .009, m.black, .003);
      }
    } else if (item.id === "contact") {
      a.cylinder(0, -.04, 0, .82, .9, .15, m.trim);
      a.box(0, .25, -.17, .39, .53, .13, graphite, .04, [-.3, 0, 0]);
      const handset = new AssetBuilder({});
      handset.root.position.set(0, .94, 0);
      handset.root.rotation.set(-.22, -.16, -.085);
      handset.box(0, 0, 0, .94, 1.83, .119, brushedEdge, .09);
      handset.box(0, 0, .057, .907, 1.796, .035, m.black, .055);
      handset.add(new T.PlaneGeometry(.817, 1.64), screens.phone, [0, 0, .077]);
      handset.box(0, .75, .082, .196, .055, .014, m.black, .015);
      handset.box(0, -.755, .082, .238, .012, .006, m.white, .003);
      handset.box(.471, .26, -.002, .026, .22, .047, graphite, .009);
      a.root.add(handset.finish());
    }
    const object = a.finish(); object.userData.homeY = object.position.y; object.userData.homeRotation = object.rotation.z; objects.set(item.id, object); root.add(object); moving.set(item.id, object);
    await checkpoint();
  }
  // About destination is represented by a miniature illuminated city on the desk.
  const about = new AssetBuilder(m); about.root.position.set(2.86, 2.37, 3.2); about.root.userData.section = "about";
  about.cylinder(0, .12, 0, .9, 1, .24, m.trim); about.cylinder(0, .26, 0, .87, .87, .035, m.cyan);
  about.add(new T.TorusGeometry(.86, .018, 8, 48), m.purple, [0, .295, 0], [Math.PI / 2, 0, 0]);
  const facade = canvasTexture(128, 256, c => {
    c.fillStyle = "#3d4267"; c.fillRect(0, 0, 128, 256);
    for (let row = 0; row < 16; row++) for (let col = 0; col < 6; col++) {
      c.fillStyle = ["#9380d2", "#8ac4e6", "#4b517a", "#e9c39e"][(col * 11 + row * 7 + row % 3) % 4];
      c.fillRect(4 + col * 21, 5 + row * 16, 12, 7);
    }
  });
  const towerGlass = mat("#d5d5fa", { map: facade, emissiveMap: facade, emissive: "#aba2ef", emissiveIntensity: .85, metalness: .23, roughness: .32 });
  for (let i = 0; i < 15; i++) {
    const radius = Math.sqrt(i / 15) * .72, angle = i * 2.399;
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    const h = 1.05 - radius * .85 + random() * .15, w = .115 + random() * .09;
    about.box(x, .29 + h / 2, z, w, h, w, towerGlass, .005);
    about.box(x, .30 + h, z, w * .83, .038, w * .83, i % 2 ? m.purple : m.cyan, .008);
    if (i % 4 === 0) about.cylinder(x, .36 + h, z, .004, .012, .13, m.silver, 8);
  }
  objects.set("about", about.finish()); root.add(about.root);
  return { root, objects, moving, dispose: () => disposeObject(root) };
}
