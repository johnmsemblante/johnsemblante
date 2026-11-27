import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { disposeObject } from "./assets";

type Placement = [parent: T.Object3D, x: number, y: number, z: number, height: number, yaw: number];

// Clones share geometry, textures and materials, including across shelf rows.
export async function loadStudioProps(root: T.Group, shelf: T.Object3D, signal: AbortSignal, invalidate: () => void, economical = false) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  async function install(name: string, placements: Placement[]) {
    const response = await fetch(`/models/digital-hq/${name}${economical ? "-low" : ""}.glb`, { signal });
    if (!response.ok) throw Error(`Could not load ${name}`);
    const { scene } = await loader.parseAsync(await response.arrayBuffer(), "");
    if (signal.aborted) { disposeObject(scene); return; }
    const bounds = new T.Box3().setFromObject(scene);
    const center = bounds.getCenter(new T.Vector3());
    const extent = bounds.max.y - bounds.min.y;
    scene.position.set(-center.x, -bounds.min.y, -center.z);
    scene.traverse(object => {
      if (object instanceof T.Mesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    for (const [index, [parent, x, y, z, height, yaw]] of placements.entries()) {
      const stand = new T.Group();
      stand.name = name;
      stand.add(index ? scene.clone(true) : scene);
      stand.scale.setScalar(height / extent);
      stand.rotation.y = yaw;
      stand.position.set(x, y, z);
      parent.add(stand);
    }
    invalidate();
  }
  const rows: Placement[] = Array.from({ length: 5 }, (_, i) => [shelf, -.88, .48 + i * 1.16, .18, .90, .06 * Math.sin(i)]);
  const results = await Promise.allSettled([
    install("camera", [[root, -5.06, 2.38, 3.08, .72, -.24]]),
    install("task-lamp", [[root, -4.98, 2.38, 1.52, 1.84, -1.32]]),
    install("plant", [[root, -8, .35, 3.6, 2.23, .24], [root, 7.3, .35, 2.6, 2.13, 2.1], [root, 4.49, 2.38, 1.95, .89, .82]]),
    install("volumes", rows),
  ]);
  if (!signal.aborted) for (const result of results) if (result.status === "rejected") console.warn("Digital HQ prop unavailable", result.reason);
}
