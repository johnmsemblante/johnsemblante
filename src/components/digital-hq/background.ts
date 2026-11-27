import * as T from "three";
import { AssetBuilder, canvasTexture } from "./assets";

// A reference-derived architectural matte behind real, separately rendered objects.
// Keeping the distant city in HTML avoids a large GPU texture or a second engine.

function leaf(length: number, width: number) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rows = 10;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows, spread = Math.pow(Math.sin(Math.PI * t), .8) * width;
    for (const side of [-1, 0, 1]) {
      positions.push(side * spread, t * length, Math.sin(t * Math.PI) * (.07 + Math.abs(side) * -.06) + t * t * .09);
      uvs.push((side + 1) / 2, t);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < 2; column++) {
    const a = row * 3 + column, b = a + 3; indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3)); geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export function buildBackgroundDetails() {
  const vein = canvasTexture(64, 128, c => {
    const gradient = c.createLinearGradient(0, 0, 64, 0); gradient.addColorStop(0, "#38542a"); gradient.addColorStop(.5, "#769650"); gradient.addColorStop(1, "#31492a"); c.fillStyle = gradient; c.fillRect(0, 0, 64, 128);
    c.strokeStyle = "#a2b36b70"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(32, 0); c.lineTo(32, 128); c.stroke();
    c.strokeStyle = "#b8c78535"; c.lineWidth = .65;
    for (let y = 15; y < 125; y += 15) for (const side of [-1, 1]) { c.beginPath(); c.moveTo(32, y); c.quadraticCurveTo(32 + side * 14, y - 6, 32 + side * 30, y - 20); c.stroke(); }
  });
  const green = new T.MeshStandardMaterial({ color: "#9da877", map: vein, roughness: .62, side: T.DoubleSide });
  const olive = new T.MeshStandardMaterial({ color: "#c7ba6a", map: vein, roughness: .65, side: T.DoubleSide });
  const stem = new T.MeshStandardMaterial({ color: "#3e4929", roughness: .85 });
  const light = new T.MeshStandardMaterial({ color: "#ffae5f", emissive: "#ff871e", emissiveIntensity: 2.1 });
  const dark = new T.MeshStandardMaterial({ color: "#201e2e", metalness: .45, roughness: .4 });
  const a = new AssetBuilder({});
  let seed = 3181; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Only corner clusters hang in front of the matte; the window stays unobstructed.
  for (const [startX, startY, z, count] of [[-9.3, 10.7, -3, 9], [8.9, 11.7, -4.8, 7], [-1, 12.2, -5.7, 4]]) {
    for (let strand = 0; strand < count; strand++) {
      const x = startX + (random() - .5) * 2.2, y = startY + random() * .6, drop = .65 + random() * 1.75;
      a.tube([[x, y + .8, z], [x + .1, y, z + .1], [x + .25, y - drop, z + .22]], .018, stem, 8);
      for (let j = 0; j < 6; j++) {
        const side = j % 2 ? 1 : -1, along = j / 6;
        a.add(leaf(.37 + random() * .22, .13 + random() * .055), j % 3 ? green : olive, [x + .18 * along, y + .22 - along * drop, z + .17 * along], [.25 + random() * .45, side * (.1 + random() * .8), Math.PI + side * (.35 + random() * .8)]);
      }
    }
  }
  // A physical rear light reveal reinforces the warm architectural baseboard.
  a.box(-7.8, .5, -6.2, 9.5, .11, .14, dark, .025);
  a.box(-7.8, .53, -6.1, 9.2, .03, .04, light, .01);
  const root = a.finish();
  const floor = new T.Mesh(new T.PlaneGeometry(80, 80), new T.ShadowMaterial({ opacity: .22 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.34; floor.receiveShadow = true; root.add(floor);
  return root;
}
