"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import * as T from "three";
import { buildEnvironment } from "./environment";
import { loadCharacter, type CharacterState } from "./character";
import { characterConfig, previewCharacterEnabled } from "./character-config";
import { buildLighting } from "./lighting";
import { hqObjects, overview, type Quality, type SectionId } from "./objects";

export type HQHandle = {
  select: (id: SectionId | null) => void; highlight: (id: SectionId | null) => void;
  tilt: (x: number, y: number) => void; rotate: (amount: number) => void;
  control: (action: "left" | "right" | "in" | "out" | "reset") => void;
};
type Props = {
  api: MutableRefObject<HQHandle | null>; quality: Quality; reducedMotion: boolean;
  selected: SectionId | null; active: boolean; onSelect: (id: SectionId) => void;
  onReady: () => void; onFailure: () => void; onCharacter: (status: "preview" | "ready" | "missing" | "failed") => void;
  onQuality: (quality: Quality) => void;
  project: (id: SectionId, x: number, y: number, visible: boolean) => void;
};

function World(props: Props) {
  const { camera, gl, size, invalidate } = useThree();
  const environment = useRef<Awaited<ReturnType<typeof buildEnvironment>> | null>(null);
  const character = useRef<Awaited<ReturnType<typeof loadCharacter>>>(null);
  const [assets, setAssets] = useState<T.Group | null>(null);
  const focus = useRef<SectionId | null>(props.selected), hover = useRef<SectionId | null>(null);
  const target = useRef(new T.Vector3(...overview.target));
  const desiredPosition = useRef(new T.Vector3()), desiredTarget = useRef(new T.Vector3());
  const pointer = useRef(new T.Vector2()), yaw = useRef(0), zoom = useRef(1), awakeUntil = useRef(0), slowFrames = useRef(0);
  const projection = useRef(new T.Vector3());
  const ready = useRef(false);
  const latest = useRef(props); latest.current = props;
  function wake(duration = 1.6) { awakeUntil.current = performance.now() + duration * 1000; invalidate(); }
  useEffect(() => {
    const controller = new AbortController(); let disposed = false;
    let model: Awaited<ReturnType<typeof buildEnvironment>> | null = null;
    let lights: ReturnType<typeof buildLighting> | null = null;
    void (async () => {
      const built = await buildEnvironment(controller.signal);
      if (disposed) { built.dispose(); return; }
      model = built; environment.current = built;
      lights = buildLighting(true);
      const all = new T.Group(); all.add(built.root, lights.root);
      void loadCharacter({ url: characterConfig.modelUrl, preview: previewCharacterEnabled, signal: controller.signal, reducedMotion: latest.current.reducedMotion }).then(result => {
        if (disposed) { result?.dispose(); return; }
        character.current = result;
        if (result) { all.add(result.root); built.objects.set("about", result.root as T.Group); result.animation.play("welcome"); }
        latest.current.onCharacter(result ? result.temporary ? "preview" : "ready" : "missing"); wake(3);
      }).catch(() => { if (!disposed) { latest.current.onCharacter("failed"); invalidate(); } });
      props.api.current = {
        select(id) { focus.current = id; const item = hqObjects.find(o => o.id === id); character.current?.animation.play((item?.character ?? "idle") as CharacterState); wake(); },
        highlight(id) { hover.current = id; wake(.7); },
        tilt(x, y) { if (latest.current.reducedMotion) return; pointer.current.set(T.MathUtils.clamp(x, -1, 1), T.MathUtils.clamp(y, -1, 1)); wake(.7); },
        rotate(amount) { if (latest.current.reducedMotion) return; yaw.current = T.MathUtils.clamp(yaw.current + amount, -.25, .25); wake(); },
        control(action) { if (action === "reset") { focus.current = null; pointer.current.set(0, 0); yaw.current = 0; zoom.current = 1; character.current?.animation.play("idle"); }
          if (action === "left") yaw.current = Math.max(-.25, yaw.current - .08);
          if (action === "right") yaw.current = Math.min(.25, yaw.current + .08);
          if (action === "in") zoom.current = Math.max(.78, zoom.current - .08);
          if (action === "out") zoom.current = Math.min(1.25, zoom.current + .08); wake(); },
      };
      props.api.current.select(latest.current.selected);
      const warmup = new T.Scene(); warmup.add(all);
      await gl.compileAsync(warmup, camera);
      warmup.remove(all);
      if (disposed) return;
      setAssets(all); wake();
    })().catch(() => { if (!disposed) latest.current.onFailure(); });
    return () => { disposed = true; controller.abort(); props.api.current = null; character.current?.dispose(); character.current = null; model?.dispose(); lights?.dispose(); environment.current = null; };
    // Assets have one lifetime per mounted Canvas; callbacks are read through latest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);
  useEffect(() => { props.api.current?.select(props.selected); }, [props.selected, props.api]);
  useEffect(() => { wake(); }, [size.width, size.height, props.quality, props.active]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!environment.current || !assets || !latest.current.active) return;
    const began = performance.now(), reduced = latest.current.reducedMotion;
    const section = hqObjects.find(o => o.id === focus.current);
    desiredPosition.current.set(...(section?.camera.position ?? overview.position));
    desiredTarget.current.set(...(section?.camera.target ?? overview.target));
    const fit = size.width < 760 ? .78 : Math.max(1, 1.64 / (size.width / size.height));
    desiredPosition.current.sub(desiredTarget.current).multiplyScalar(fit * zoom.current).applyAxisAngle(T.Object3D.DEFAULT_UP, yaw.current).add(desiredTarget.current);
    if (!reduced) { desiredPosition.current.x += pointer.current.x * .22; desiredPosition.current.y -= pointer.current.y * .12; }
    const ease = reduced ? 1 : 1 - Math.exp(-Math.min(delta, .05) * 7);
    camera.position.lerp(desiredPosition.current, ease); target.current.lerp(desiredTarget.current, ease); camera.lookAt(target.current); camera.updateMatrixWorld();
    let moving = camera.position.distanceToSquared(desiredPosition.current) > .00001 || target.current.distanceToSquared(desiredTarget.current) > .00001;
    for (const item of hqObjects) {
      const object = environment.current.moving.get(item.id);
      if (object) {
        const highlighted = item.id === (hover.current ?? focus.current);
        const wantedY = object.userData.homeY + (highlighted && !reduced ? item.id === "ventures" ? .24 : .09 : 0);
        const nextY = T.MathUtils.lerp(object.position.y, wantedY, ease);
        if (Math.abs(nextY - wantedY) > .001) moving = true; object.position.y = nextY;
        const tilt = highlighted && item.hover === "tilt" && !reduced ? .045 : 0; object.rotation.z = T.MathUtils.lerp(object.rotation.z, tilt, ease);
      }
      projection.current.set(item.anchor[0], item.anchor[1], item.anchor[2]).project(camera);
      latest.current.project(item.id, (projection.current.x * .5 + .5) * size.width, (-projection.current.y * .5 + .5) * size.height, Math.abs(projection.current.x) < 1.1 && Math.abs(projection.current.y) < 1.1 && Math.abs(projection.current.z) < 1);
    }
    if (!reduced) character.current?.animation.update(Math.min(delta, .05));
    if (!ready.current) { ready.current = true; latest.current.onReady(); }
    // Reduced motion and low quality settle on demand. An animated rig keeps
    // frames alive at higher quality only while the scene is visible.
    if (!reduced && latest.current.quality !== "low" && character.current) moving = true;
    if (moving || performance.now() < awakeUntil.current) invalidate();
    if (performance.now() - began > 36) slowFrames.current++; else slowFrames.current = Math.max(0, slowFrames.current - 1);
    if (slowFrames.current > 24 && latest.current.quality !== "low") { slowFrames.current = 0; latest.current.onQuality("low"); }
  });
  function findSection(object: T.Object3D | null): SectionId | null {
    while (object) { if (object.userData.section) return object.userData.section; object = object.parent; } return null;
  }
  return <>
    {assets && <primitive object={assets} dispose={null} onPointerOver={(event: { object: T.Object3D }) => { props.api.current?.highlight(findSection(event.object)); }} onPointerOut={() => props.api.current?.highlight(null)} onClick={(event: { object: T.Object3D; delta: number; stopPropagation: () => void }) => { const id = findSection(event.object); if (id && event.delta < 5) { event.stopPropagation(); latest.current.onSelect(id); } }}/>}
  </>;
}

export default function DigitalHQCanvas(props: Props) {
  return <Canvas frameloop={props.active ? "demand" : "never"} shadows={props.quality === "high" ? { type: T.PCFShadowMap } : false} dpr={[1, props.quality === "high" ? 1.5 : props.quality === "medium" ? 1.2 : 1]} camera={{ position: [...overview.position], fov: 43, near: .1, far: 100 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power", toneMapping: T.ACESFilmicToneMapping, toneMappingExposure: 1.1 }} onCreated={({ gl }) => {
    gl.setClearColor("#000000", 0);
    const lost = (event: Event) => { event.preventDefault(); props.onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost, { once: true });
  }} fallback={<span>3D is unavailable. All Digital HQ links remain available.</span>}><World {...props}/></Canvas>;
}
