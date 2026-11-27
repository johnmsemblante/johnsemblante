import * as T from "three";
import { AssetBuilder, canvasTexture, disposeObject } from "./assets";
import { hqObjects, type SectionId } from "./objects";
import { buildBackgroundDetails } from "./background";

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
    wood: mat("#b49d8b", { roughness: .45 }), walnut: mat("#462c2c"), leather: mat("#191c2c", { roughness: .88 }),
    silver: mat("#b2bdd1", { metalness: .8, roughness: .28 }), white: mat("#e5e4e6", { metalness: .15, roughness: .3 }),
    amber: mat("#ffc471", { emissive: "#ffab4f", emissiveIntensity: 2 }), cyan: mat("#83e5ef", { emissive: "#4cc9ef", emissiveIntensity: 1.3 }),
    purple: mat("#d298f1", { emissive: "#a953e5", emissiveIntensity: 1.4 }), red: mat("#e6655f"), teal: mat("#297986"), yellow: mat("#daaa58"),
    leaf: mat("#537e4b"), leafLight: mat("#80a257"), stem: mat("#364b38"), ceramic: mat("#c8b9ab"), soil: mat("#25262a"), blue: mat("#436aa0"),
  };
  const wood = canvasTexture(512, 256, c => {
    c.fillStyle = "#c59a78"; c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 650; i++) { c.strokeStyle = random() > .5 ? "#512a2022" : "#ffe4ba24"; c.lineWidth = .5 + random(); const y = random() * 256; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(190, y + 4, 360, y - 3, 512, y + 2); c.stroke(); }
  });
  m.wood.map = wood;
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
  await checkpoint();
  function plant(a: AssetBuilder, x: number, y: number, z: number, scale = 1) {
    a.cylinder(x, y + .29 * scale, z, .27 * scale, .19 * scale, .58 * scale, m.ceramic);
    a.cylinder(x, y + .58 * scale, z, .245 * scale, .245 * scale, .025, m.soil);
    for (let i = 0; i < 10; i++) {
      const angle = i * 2.399, top = y + (.9 + random() * .8) * scale;
      const dx = Math.cos(angle) * .55 * scale, dz = Math.sin(angle) * .55 * scale;
      a.tube([[x, y + .5 * scale, z], [x + dx * .3, top - .2 * scale, z + dz * .3], [x + dx, top, z + dz]], .018 * scale, m.stem, 7);
      const g = new T.SphereGeometry(1, 10, 8); g.scale(.13 * scale, .43 * scale, .045 * scale);
      g.rotateZ(-Math.cos(angle) * .8); g.rotateX(Math.sin(angle) * .8); a.add(g, i % 2 ? m.leaf : m.leafLight, [x + dx, top, z + dz]);
    }
  }
  const architecture = new AssetBuilder(m);
  // Elliptical architectural platform with a warm inset light and metal reveals.
  for (const [y, r, h, material] of [[-.16, 9.4, .36, m.black], [.04, 9.25, .07, m.amber], [.16, 9.3, .18, m.trim], [.28, 9.2, .12, m.walnut]] as const) {
    const g = new T.CylinderGeometry(r, r, h, 96); g.scale(1, 1, .65); architecture.add(g, material, [0, y, 0]);
  }
  plant(architecture, -8.8, .35, -3.7, 2.1); plant(architecture, 8.7, .35, -4, 1.7);
  plant(architecture, -8, .35, 3.6, 1.1); plant(architecture, 7.1, .35, 3, 1);
  root.add(buildBackgroundDetails());
  root.add(architecture.finish());
  await checkpoint();
  const desk = new AssetBuilder(m);
  // A curved slab, extruded from a custom outline and bevelled on every edge.
  const outline = new T.Shape(); outline.moveTo(-5.8, -.7); outline.bezierCurveTo(-6.6, .7, -6, 2.9, -3.3, 3.25); outline.bezierCurveTo(-.6, 3.65, 3.4, 3.5, 5.8, 2.5); outline.bezierCurveTo(6.5, 2.2, 6.4, .1, 5.8, -.65); outline.quadraticCurveTo(3.2, -1.1, 1.5, -.9); outline.quadraticCurveTo(-2, -1.6, -5.8, -.7);
  const slab = new T.ExtrudeGeometry(outline, { depth: .18, bevelEnabled: true, bevelThickness: .065, bevelSize: .065, bevelSegments: 3, curveSegments: 32 }); slab.rotateX(-Math.PI / 2); desk.add(slab, m.wood, [0, 2.15, 1]);
  for (const x of [-4.8, 4.8]) { desk.box(x, 1.25, 1.5, .2, 1.9, 1.4, m.trim); desk.box(x, .4, 1.5, .9, .12, 1.8, m.black); }
  desk.tube([[-5.7, 2.12, 3], [-3, 2.12, 4.1], [1, 2.12, 4.35], [5.8, 2.12, 3.4]], .026, m.amber, 40);
  desk.box(0, 2.39, 3, 3.4, .045, 1.15, m.leather, .14);
  desk.box(-.35, 2.45, 3, 2.12, .1, .64, m.black);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 14; col++) desk.box(-1.29 + col * .145, 2.515, 2.78 + row * .14, .12, .04, .1, col % 4 === 0 ? m.purple : m.trim, .012);
    await checkpoint();
  }
  desk.box(-.3, 2.54, 3.29, .7, .025, .09, m.silver, .01); desk.sphere(1.15, 2.5, 3.1, .18, .1, .28, m.black);
  // Open laptop: the lid has a screen facing the seated character, no invented logo.
  desk.box(-.3, 2.44, 1.4, 2.4, .1, 1.35, m.trim);
  desk.box(-.3, 3.1, 1.02, 2.4, 1.4, .09, m.black, .06, [-.18, 0, 0]);
  desk.box(-.3, 3.1, 1.075, 2.2, 1.2, .012, m.trim, .015, [-.18, 0, 0]);
  // Ceramic coffee mug and handle.
  desk.cylinder(1.8, 2.7, 1.9, .24, .2, .55, m.black); desk.cylinder(1.8, 2.98, 1.9, .2, .2, .015, m.walnut);
  desk.add(new T.TorusGeometry(.18, .045, 8, 20), m.black, [2.08, 2.7, 1.9]);
  const bookTitles = ["CREATIVE TECH", "WORDPRESS", "FRONTEND", "UI / UX DESIGN"];
  const bookMap = canvasTexture(512, 256, c => { c.fillStyle = "#d8b88d"; c.fillRect(0, 0, 512, 256); c.font = "bold 20px sans-serif"; c.fillStyle = "#302738"; bookTitles.forEach((text, i) => c.fillText(text, 22, 40 + i * 60)); });
  const bookMat = mat("#ffffff", { map: bookMap });
  for (let i = 0; i < 4; i++) { desk.box(-4, 2.46 + i * .15, 2.9, 1.55 - i * .07, .13, .9, [m.teal, m.yellow, m.blue, m.purple][i]); desk.box(-4, 2.46 + i * .15, 3.36, 1.3, .09, .006, bookMat, 0); }
  plant(desk, -5.1, 2.38, .8, .55);
  // Small desk lamp with warm diffuser.
  desk.cylinder(-5, 2.43, 2, .26, .3, .1, m.black); desk.tube([[-5, 2.5, 2], [-5, 3.7, 2], [-4.4, 4.1, 1.8]], .045, m.trim); desk.sphere(-4.35, 4.05, 1.8, .32, .12, .3, m.black); desk.sphere(-4.35, 4, 1.8, .27, .035, .26, m.amber);
  root.add(desk.finish());
  await checkpoint();
  const chair = new AssetBuilder(m);
  chair.cylinder(0, 1, -.6, .1, .1, 1.3, m.trim); chair.box(0, 1.75, -.45, 1.8, .32, 1.6, m.leather, .15);
  chair.box(0, 3.15, -1.15, 1.85, 2.8, .4, m.black, .18); chair.box(0, 3.2, -.89, 1.46, 2.25, .2, m.leather, .14);
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
      a.box(0, 1.3, 0, 1.8, 2.6, .24, m.black, .1, [0, .15, -.15]);
      a.box(0, 1.2, .15, 1.51, 1.45, .045, m.walnut, .06, [0, .15, -.15]);
      for (let i = 0; i < 7; i++) a.box(-.66 + i * .22, 2.25, .16, .15, .4, .035, m.yellow, .012, [0, .15, -.15]);
      a.tube([[-.96, .1, .18], [.98, .1, .18], [.96, 2.6, .18]], .02, m.amber, 12);
      a.box(0, -.12, 0, 2.5, .18, 1.3, m.trim, .1);
    } else if (item.id === "skills") {
      for (const [x, angle, material] of [[-.7, .08, screens.code], [.9, -.18, screens.work]] as const) {
        a.box(x, .07, 0, .8, .08, .6, m.silver); a.box(x, .5, -.13, .1, .9, .1, m.trim);
        a.box(x, 1.2, -.12, 1.75, 1.17, .09, m.black, .05, [0, angle, 0]); a.box(x, 1.2, -.055, 1.61, 1.02, .015, material, .015, [0, angle, 0]);
        a.box(x, .63, -.05, 1.4, .018, .018, m.cyan, .006);
      }
    } else if (item.id === "ventures") {
      a.cylinder(0, .02, 0, .83, .9, .16, m.trim); a.cylinder(0, .12, 0, .78, .78, .035, m.amber);
      a.add(new T.CapsuleGeometry(.34, .75, 8, 24), m.white, [0, 1.15, 0], [0, 0, -.25]);
      a.add(new T.ConeGeometry(.34, .6, 24), m.red, [.2, 1.97, 0], [0, 0, -.25]);
      a.sphere(.05, 1.4, .31, .17, .17, .04, m.trim); a.sphere(.05, 1.4, .35, .125, .125, .025, m.cyan);
      for (const x of [-.37, .37]) a.box(x - .15, .7, 0, .15, .6, .46, m.red, .04, [0, 0, -x]);
      a.add(new T.ConeGeometry(.18, .45, 16), m.amber, [-.19, .32, 0], [Math.PI, 0, -.25]);
      a.tube([[-.7, .4, 0], [-.9, 1.4, 0], [0, 2.3, 0], [.7, 1.8, 0]], .013, m.purple);
    } else if (item.id === "blog") {
      a.box(0, 2.8, -.2, 3, 5.2, .16, m.walnut);
      for (const x of [-1.5, 1.5]) a.box(x, 2.8, 0, .14, 5.5, .85, m.wood);
      for (let row = 0; row < 5; row++) {
        const y = .4 + row * 1.16; a.box(0, y, .1, 3.1, .13, .9, m.wood); a.box(0, y + .08, .53, 2.92, .026, .025, m.amber);
        let x = -1.3; while (x < 1.2) { const w = .12 + random() * .13, h = .58 + random() * .33; a.box(x, y + .11 + h / 2, .15, w, h, .43, [m.teal, m.red, m.yellow, m.blue, m.ceramic][Math.floor(random() * 5)], .012); a.box(x, y + .25, .38, w * .7, .022, .006, m.ceramic, 0); x += w + .06; }
        await checkpoint();
      }
      plant(a, -.8, 6, 0, .7); a.sphere(.7, 6, 0, .44, .44, .44, m.blue); a.add(new T.TorusGeometry(.48, .025, 8, 36), m.yellow, [.7, 6, 0], [0, 0, -.2]);
    } else if (item.id === "tools") {
      a.box(0, .35, 0, 1.95, .7, .9, m.black, .09); a.box(0, .75, -.33, 1.98, .16, .91, m.trim, .05, [-.65, 0, 0]);
      for (const x of [-.65, .65]) { a.box(x, .36, .47, .15, .25, .04, m.silver); a.box(x, .37, .5, .06, .12, .02, m.walnut); }
      for (let i = 0; i < 6; i++) { const x = -.7 + i * .28; a.box(x, .95, 0, .07, .68, .07, i % 2 ? m.yellow : m.silver, .02, [0, 0, (i - 2.5) * .1]); a.add(new T.TorusGeometry(.11, .035, 8, 14, Math.PI * 1.5), m.silver, [x, 1.3, 0]); }
      a.tube([[-.35, .65, .46], [-.35, .8, .46], [.35, .8, .46], [.35, .65, .46]], .045, m.silver, 10);
    } else if (item.id === "arcade") {
      a.box(0, 1.2, 0, 1.65, 2.1, 1.25, m.black, .1);
      for (const x of [-.86, .86]) { a.box(x, 2.2, -.2, .12, 4.3, 1.45, m.wall); a.tube([[x, .2, .55], [x, 2.15, .55], [x, 2.6, .2], [x, 3.8, .15], [x, 4.3, .5]], .025, m.purple, 10); }
      a.box(0, 3.1, .08, 1.64, 1.5, .12, m.trim, .04, [-.18, 0, 0]); a.box(0, 3.1, .16, 1.47, 1.3, .01, screens.arcade, .01, [-.18, 0, 0]);
      a.box(0, 4.15, -.03, 1.95, .55, 1.5, m.black, .07); a.box(0, 4.15, .74, 1.69, .33, .015, screens.arcade, 0);
      a.box(0, 2.1, .64, 1.9, .17, .78, m.trim); a.cylinder(-.48, 2.34, .68, .03, .03, .35, m.silver); a.sphere(-.48, 2.53, .68, .12, .12, .12, m.red);
      for (let i = 0; i < 4; i++) a.cylinder(.1 + (i % 2) * .3, 2.23, .57 + Math.floor(i / 2) * .25, .09, .09, .05, i % 2 ? m.yellow : m.cyan, 16);
      a.box(0, 1.15, .66, .5, .25, .02, m.trim); a.box(0, 1.18, .68, .24, .04, .02, m.black);
    } else if (item.id === "contact") {
      a.cylinder(0, -.04, 0, .82, .9, .15, m.trim); a.box(0, .91, 0, .92, 1.85, .1, m.silver, .09, [-.2, 0, -.08]); a.box(0, .91, .065, .82, 1.72, .012, screens.phone, .065, [-.2, 0, -.08]); a.box(0, 1.67, .22, .23, .045, .02, m.black, .02);
    }
    const object = a.finish(); object.userData.homeY = object.position.y; object.userData.homeRotation = object.rotation.z; objects.set(item.id, object); root.add(object); moving.set(item.id, object);
    await checkpoint();
  }
  // About destination is represented by a miniature illuminated city on the desk.
  const about = new AssetBuilder(m); about.root.position.set(2, .8, 4); about.root.userData.section = "about";
  about.cylinder(0, .12, 0, .9, 1, .24, m.trim); about.cylinder(0, .26, 0, .87, .87, .035, m.amber);
  for (let i = 0; i < 13; i++) { const angle = i * 2.399, radius = .25 + random() * .45, h = .25 + random() * .8; about.box(Math.sin(angle) * radius, .3 + h / 2, Math.cos(angle) * radius, .12, h, .15, i % 2 ? m.cyan : m.purple, .012); }
  objects.set("about", about.finish()); root.add(about.root);
  return { root, objects, moving, dispose: () => disposeObject(root) };
}
