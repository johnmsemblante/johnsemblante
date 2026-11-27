import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Original procedural assets. Static parts are merged by material per object.
export class AssetBuilder {
  root = new T.Group();
  private batches = new Map<T.Material, T.BufferGeometry[]>();
  constructor(public materials: Record<string, T.Material>) {}
  add(geometry: T.BufferGeometry, material: T.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) {
    geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(1, 1, 1)));
    if (geometry.index) { const next = geometry.toNonIndexed(); geometry.dispose(); geometry = next; }
    const batch = this.batches.get(material) ?? []; batch.push(geometry); this.batches.set(material, batch);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, material: T.Material, radius = .04, rotation: [number, number, number] = [0, 0, 0]) {
    this.add(radius ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)) : new T.BoxGeometry(w, h, d), material, [x, y, z], rotation);
  }
  cylinder(x: number, y: number, z: number, top: number, bottom: number, height: number, material: T.Material, segments = 32) { this.add(new T.CylinderGeometry(top, bottom, height, segments), material, [x, y, z]); }
  sphere(x: number, y: number, z: number, sx: number, sy: number, sz: number, material: T.Material, segments = 16) { const g = new T.SphereGeometry(1, segments, 12); g.scale(sx, sy, sz); this.add(g, material, [x, y, z]); }
  tube(points: [number, number, number][], radius: number, material: T.Material, segments = 24) { this.add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), segments, radius, 6, false), material, [0, 0, 0]); }
  finish() {
    for (const [material, geometries] of this.batches) {
      const geometry = mergeGeometries(geometries);
      geometries.forEach(g => g.dispose());
      if (geometry) { const mesh = new T.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; this.root.add(mesh); }
    }
    this.batches.clear(); return this.root;
  }
}
export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const context = canvas.getContext("2d"); if (!context) throw Error("Canvas textures unavailable"); draw(context);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; return texture;
}
export function disposeObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>(), skeletons = new Set<T.Skeleton>();
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material); for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
    }
    if (object instanceof T.SkinnedMesh) skeletons.add(object.skeleton);
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); skeletons.forEach(s => s.dispose());
}
