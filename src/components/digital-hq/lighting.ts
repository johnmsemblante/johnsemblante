import * as T from "three";
export function buildLighting(shadows: boolean) {
  const group = new T.Group();
  group.add(new T.HemisphereLight("#b1a3df", "#432c3a", 1.8));
  const key = new T.DirectionalLight("#ffdab5", 3.5); key.position.set(-5, 10, 8); key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -12, right: 12, top: 10, bottom: -10 }); key.shadow.normalBias = .04; group.add(key);
  const rim = new T.DirectionalLight("#9988ec", 2.6); rim.position.set(6, 5, -4); group.add(rim);
  const warm = new T.PointLight("#ffb875", 42, 14); warm.position.set(-4, 4, 3); group.add(warm);
  const cyan = new T.PointLight("#79cce9", 28, 12); cyan.position.set(5, 5, 2); group.add(cyan);
  return { root: group, dispose() { key.shadow.map?.dispose(); } };
}
