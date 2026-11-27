import * as T from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { canvasTexture } from "./assets";

export function buildLighting(shadows: boolean, scene: T.Scene) {
  // Studio softboxes, the sunset window and the ceiling strip reflected in glossy surfaces.
  const reflection = canvasTexture(512, 256, c => {
    const room = c.createLinearGradient(0, 0, 0, 256);
    room.addColorStop(0, "#4a4263"); room.addColorStop(.48, "#55445b");
    room.addColorStop(.62, "#271f2d"); room.addColorStop(1, "#302825");
    c.fillStyle = room; c.fillRect(0, 0, 512, 256);
    const window = c.createLinearGradient(0, 55, 0, 140);
    window.addColorStop(0, "#9884e7"); window.addColorStop(1, "#ffaf91");
    c.fillStyle = window;
    for (let i = 0; i < 5; i++) c.fillRect(282 + i * 26, 58, 24, 72);
    c.fillStyle = "#fff1cf"; c.fillRect(43, 45, 106, 12); c.fillRect(192, 71, 32, 60);
    c.fillStyle = "#bad8ff"; c.fillRect(446, 73, 17, 68);
  });
  reflection.mapping = T.EquirectangularReflectionMapping;
  scene.environment = reflection;
  scene.environmentIntensity = .84;
  let disposed = false;
  let studio: T.DataTexture | undefined;
  const ready = new HDRLoader().loadAsync("/models/digital-hq/studio.hdr").then(texture => {
    if (disposed) { texture.dispose(); return; }
    studio = texture;
    texture.mapping = T.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = .43;
    scene.environmentRotation.y = 1.05;
  }).catch(() => { /* The local softbox reflection remains available. */ });
  const group = new T.Group();
  group.add(new T.HemisphereLight("#b1a3df", "#432c3a", 1.15));
  const key = new T.DirectionalLight("#ffdab5", 3.5); key.position.set(-5, 10, 8); key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 }); key.shadow.normalBias = .04; group.add(key);
  const rim = new T.DirectionalLight("#9988ec", 2.6); rim.position.set(6, 5, -4); group.add(rim);
  const warm = new T.PointLight("#ffb875", 42, 14); warm.position.set(-4, 4, 3); group.add(warm);
  const cyan = new T.PointLight("#79cce9", 28, 12); cyan.position.set(5, 5, 2); group.add(cyan);
  const shelf = new T.PointLight("#ffc17f", 4.5, 6, 2);
  shelf.position.set(4.4, 5.57, -2.4); group.add(shelf);
  const lamp = new T.PointLight("#ffe3bc", 6.5, 4, 2);
  lamp.position.set(-4.58, 3.79, 1.72); group.add(lamp);
  return { root: group, ready, key, dispose() { disposed = true; studio?.dispose(); scene.environment = null; reflection.dispose(); key.shadow.map?.dispose(); } };
}
