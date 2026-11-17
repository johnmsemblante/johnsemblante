import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { portraitHeadWeight, portraitRig } from "./portrait-rig";
import type { PortraitPose } from "./portrait-renderer";

/** A local, embedded-texture GLB. Generation services are never called by visitors. */
export async function createGltfPortraitRenderer(canvas: HTMLCanvasElement, url: string, rotation: number[], signal: AbortSignal) {
  if (!url.startsWith("/models/portrait/") || url.includes("..")) throw new Error("Portrait must be a local model");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Portrait model unavailable");
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  // The import workflow requires embedded buffers/textures: no external resources.
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(resource => {
    if (/^(blob:|data:)/.test(resource)) return resource;
    throw new Error("Portrait textures must be embedded");
  });
  const loader = new GLTFLoader(manager);
  const gltf = await loader.parseAsync(bytes, "");
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let renderer: THREE.WebGLRenderer | undefined, skeleton: THREE.Skeleton | undefined;
  let disposed = false;
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    const bitmaps = new Set<ImageBitmap>();
    textures.forEach(texture => {
      texture.dispose();
      if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
    });
    bitmaps.forEach(bitmap => bitmap.close());
    skeleton?.dispose();
    renderer?.clear(); renderer?.dispose();
  };
  try {
    signal.throwIfAborted();
    const source = new THREE.Group();
    source.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    source.add(gltf.scene); source.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(source);
    const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("Portrait mesh is empty");
    const scale = portraitRig.height / size.y;
    const normalize = new THREE.Matrix4().makeScale(scale, scale, scale)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
    const scene = new THREE.Scene();
    const base = new THREE.Bone(), neck = new THREE.Bone();
    neck.position.set(...portraitRig.pivot); neck.rotation.order = "YXZ";
    base.add(neck); scene.add(base); scene.updateMatrixWorld(true);
    skeleton = new THREE.Skeleton([base, neck]);
    let meshCount = 0;
    source.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const geometry = object.geometry.clone(); geometries.add(geometry);
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize, object.matrixWorld));
      const position = geometry.getAttribute("position");
      const indices = new Uint16Array(position.count * 4), weights = new Float32Array(position.count * 4);
      for (let i = 0; i < position.count; i++) {
        const head = portraitHeadWeight(position.getY(i));
        indices[i * 4 + 1] = 1;
        weights[i * 4] = 1 - head; weights[i * 4 + 1] = head;
      }
      geometry.setAttribute("skinIndex", new THREE.BufferAttribute(indices, 4));
      geometry.setAttribute("skinWeight", new THREE.BufferAttribute(weights, 4));
      const mesh = new THREE.SkinnedMesh(geometry, object.material);
      mesh.frustumCulled = false; // Head rotation can exceed the rest-pose bounds.
      scene.add(mesh); mesh.bind(skeleton!); meshCount++;
    });
    if (!meshCount) throw new Error("Portrait has no renderable meshes");
    scene.add(new THREE.HemisphereLight(0xffffff, 0x777366, 2.4));
    const key = new THREE.DirectionalLight(0xfff7ed, 2.3); key.position.set(-3, 4, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xe9efff, 1.1); fill.position.set(3, 1, 3); scene.add(fill);
    const camera = new THREE.OrthographicCamera(-1, 1, 1.25, -1.25, 0.1, 20);
    camera.position.set(0, 0, 5); camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    let previousWidth = 0, previousHeight = 0, previousRatio = 0;
    return {
      draw(pose: PortraitPose) {
        if (disposed || !renderer || renderer.getContext().isContextLost()) throw new Error("Portrait context unavailable");
        const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        if (width !== previousWidth || height !== previousHeight || ratio !== previousRatio) {
          renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
          const halfHeight = Math.max(1.25, size.x * scale / (width / height) * 0.55);
          camera.left = -halfHeight * width / height; camera.right = -camera.left;
          camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix();
          previousWidth = width; previousHeight = height; previousRatio = ratio;
        }
        neck.rotation.y = pose.x * portraitRig.yaw;
        neck.rotation.x = pose.y * portraitRig.pitch;
        renderer.render(scene, camera);
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
