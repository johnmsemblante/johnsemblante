import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { AssetBuilder, disposeObject } from "./assets";
import { characterConfig } from "./character-config";

export type CharacterState = "idle" | "welcome" | "introduce" | "work" | "typing" | "reading" | "point" | "gaming" | "contact";

export class CharacterAnimationController {
  readonly mixer: T.AnimationMixer;
  private actions = new Map<string, T.AnimationAction>();
  private current?: T.AnimationAction;
  private remaining = 0;
  private idleAfter = 12;
  state: CharacterState = "idle";
  constructor(private root: T.Object3D, clips: T.AnimationClip[], private names: Record<string, string>, private reducedMotion: boolean) {
    this.mixer = new T.AnimationMixer(root);
    for (const clip of clips) this.actions.set(clip.name, this.mixer.clipAction(clip));
    this.play("idle");
  }
  play(state: CharacterState) {
    // Unsupported interactions return to the real idle clip, never deform a mesh.
    const action = this.actions.get(this.names[state]) ?? this.actions.get(this.names.idle);
    if (!action || action === this.current) return;
    const idle = action === this.actions.get(this.names.idle);
    action.reset().setEffectiveWeight(1).setLoop(idle ? T.LoopRepeat : T.LoopOnce, idle ? Infinity : 1);
    action.clampWhenFinished = !idle;
    const previous = this.current;
    action.play();
    if (previous) action.crossFadeFrom(previous, this.reducedMotion ? 0 : .25, false);
    this.current = action; this.state = idle ? "idle" : state;
    this.remaining = idle ? 0 : action.getClip().duration;
    if (this.reducedMotion) { this.mixer.update(0); action.paused = true; }
  }
  update(delta: number) {
    if (this.reducedMotion) return;
    this.mixer.update(Math.min(delta, .05));
    if (this.remaining > 0 && (this.remaining -= delta) <= 0) { this.play("idle"); this.idleAfter = 12; }
    else if (this.state === "idle" && (this.idleAfter -= delta) <= 0) { this.idleAfter = 18; if (this.actions.has(this.names.introduce)) this.play("introduce"); }
  }
  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.root); }
}

// A visibly temporary, original articulated figure. It is a genuine skinned rig,
// with rigid weights per segment and named clips, not a portrait billboard.
export function buildPreviewCharacter() {
  const root = new T.Group(); root.userData.section = "about";
  const skin = new T.MeshStandardMaterial({ color: "#b98260", roughness: .72 });
  const dark = new T.MeshStandardMaterial({ color: "#11121c", roughness: .9 });
  const hair = new T.MeshStandardMaterial({ color: "#15131a", roughness: .95 });
  const seams = new T.MeshStandardMaterial({ color: "#323346", roughness: .82 });
  const white = new T.MeshStandardMaterial({ color: "#eee0d2", roughness: .6 });
  const eye = new T.MeshStandardMaterial({ color: "#251c1b", roughness: .3 });
  const lips = new T.MeshStandardMaterial({ color: "#88544d", roughness: .8 });
  const accent = new T.MeshStandardMaterial({ color: "#9683c8", metalness: .5, roughness: .3 });
  const bones: T.Bone[] = [];
  function bone(name: string, position: [number, number, number], parent?: T.Bone) {
    const b = new T.Bone(); b.name = name; b.position.set(...position); bones.push(b); (parent ?? root).add(b); return b;
  }
  const hips = bone("Hips", [0, 1.65, -.3]);
  const chest = bone("Chest", [0, 1.05, 0], hips);
  const head = bone("Head", [0, 1.1, 0], chest);
  const leftArm = bone("LeftArm", [-.62, .65, 0], chest), rightArm = bone("RightArm", [.62, .65, 0], chest);
  const leftHand = bone("LeftHand", [-.2, -.65, .3], leftArm), rightHand = bone("RightHand", [.2, -.65, .3], rightArm);
  const leftLeg = bone("LeftLeg", [-.33, -.12, .1], hips), rightLeg = bone("RightLeg", [.33, -.12, .1], hips);
  root.updateMatrixWorld(true);
  const materialParts = new Map<T.Material, T.BufferGeometry[]>();
  function part(b: T.Bone, draw: (a: AssetBuilder) => void) {
    const a = new AssetBuilder({}); draw(a); const group = a.finish();
    for (const mesh of group.children as T.Mesh[]) {
      const g = mesh.geometry; g.applyMatrix4(b.matrixWorld);
      const count = g.attributes.position.count, indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) { indices[i * 4] = bones.indexOf(b); weights[i * 4] = 1; }
      g.setAttribute("skinIndex", new T.Uint16BufferAttribute(indices, 4)); g.setAttribute("skinWeight", new T.Float32BufferAttribute(weights, 4));
      const material = mesh.material as T.Material, batch = materialParts.get(material) ?? []; batch.push(g); materialParts.set(material, batch);
    }
  }
  part(hips, a => { a.sphere(0, .15, 0, .64, .42, .47, dark); });
  part(chest, a => {
    a.sphere(0, .12, 0, .73, .85, .43, dark, 24);
    a.sphere(0, .78, -.12, .48, .25, .35, dark);
    a.tube([[-.23, .74, .38], [-.21, .4, .46], [-.22, .2, .45]], .018, seams, 8); a.tube([[.23, .74, .38], [.24, .4, .46], [.22, .2, .45]], .018, seams, 8);
    a.tube([[-.4, -.2, .35], [0, -.32, .45], [.4, -.2, .35]], .013, seams, 8);
    // Headphones around the neck, with a curved band and upholstered ear cups.
    a.tube([[-.46, .7, .04], [-.46, .4, .38], [0, .35, .49], [.46, .4, .38], [.46, .7, .04]], .055, accent, 22);
    for (const side of [-1, 1]) { a.sphere(side * .5, .49, .29, .17, .27, .15, dark); a.sphere(side * .57, .5, .3, .09, .2, .12, accent); }
    a.cylinder(0, .93, .03, .23, .26, .32, skin);
  });
  part(head, a => {
    // Adult proportions, curly hair and chin hair informed by the existing portrait.
    // This figure is explicitly NOT an approved likeness or production character.
    a.sphere(0, .42, .02, .48, .63, .43, skin, 28); a.sphere(0, .14, .055, .37, .3, .35, skin, 24);
    for (const side of [-1, 1]) { a.sphere(side * .47, .4, .005, .085, .16, .08, skin); a.sphere(side * .187, .47, .405, .115, .068, .025, white); a.sphere(side * .187, .47, .427, .052, .055, .015, eye); a.sphere(side * .173, .49, .44, .012, .014, .008, white); a.tube([[side * .08, .6, .402], [side * .18, .63, .42], [side * .3, .6, .385]], .03, hair, 8); }
    a.sphere(0, .35, .438, .073, .13, .085, skin); a.sphere(0, .28, .48, .088, .048, .04, skin);
    a.tube([[-.15, .15, .373], [0, .125, .416], [.15, .15, .373]], .015, lips, 12);
    a.sphere(0, -.06, .296, .16, .12, .06, hair);
    a.sphere(0, .82, -.02, .49, .35, .43, hair, 24);
    for (let i = 0; i < 105; i++) { const angle = i * 2.399, t = Math.sqrt((i + .5) / 105), r = t * .49; a.sphere(Math.cos(angle) * r, .91 + Math.sqrt(1 - t * t) * .25, Math.sin(angle) * r - .03, .082, .07, .08, hair, 8); }
    for (let i = 0; i < 22; i++) { const angle = i / 22 * Math.PI * 2; a.sphere(Math.cos(angle) * .45, .78, Math.sin(angle) * .4, .085, .1, .075, hair, 8); }
  });
  for (const [arm, hand, side] of [[leftArm, leftHand, -1], [rightArm, rightHand, 1]] as const) {
    part(arm, a => { a.tube([[0, 0, 0], [side * .14, -.3, .09], [side * .2, -.62, .3]], .2, dark, 12); });
    part(hand, a => { a.tube([[0, 0, 0], [-side * .04, -.06, .3], [-side * .16, -.04, .6]], .16, dark, 12); a.sphere(-side * .18, -.04, .72, .16, .09, .2, skin); a.box(0, -.03, .48, .28, .12, .09, seams, .03); });
  }
  for (const leg of [leftLeg, rightLeg]) part(leg, a => { a.tube([[0, 0, 0], [0, -.02, .62], [0, -.35, .87], [0, -1.1, .87]], .23, dark, 15); a.sphere(0, -1.23, 1.03, .24, .17, .43, white); a.sphere(0, -1.17, 1.05, .22, .13, .36, dark); });
  const skeleton = new T.Skeleton(bones);
  for (const [material, parts] of materialParts) { const geometry = mergeGeometries(parts); parts.forEach(g => g.dispose()); if (!geometry) continue; const mesh = new T.SkinnedMesh(geometry, material); mesh.bind(skeleton); mesh.castShadow = true; mesh.frustumCulled = false; root.add(mesh); }
  const rotation = (name: string, axis: string, times: number[], values: number[]) => new T.NumberKeyframeTrack(`${name}.rotation[${axis}]`, times, values);
  const clips = [
    new T.AnimationClip("SeatedIdle", 4, [rotation("Chest", "x", [0, 2, 4], [0, .012, 0]), rotation("Head", "y", [0, 2, 4], [-.018, .018, -.018])]),
    new T.AnimationClip("Wave", 2.5, [rotation("RightArm", "z", [0, .5, 1, 1.3, 1.6, 1.9, 2.5], [0, 2.25, 2.1, 2.4, 2.1, 2.4, 0])]),
    new T.AnimationClip("Introduce", 2.4, [rotation("Head", "y", [0, .8, 1.6, 2.4], [0, -.08, .06, 0]), rotation("LeftArm", "z", [0, .8, 1.6, 2.4], [0, -.25, -.25, 0])]),
  ];
  root.scale.setScalar(1.35);
  return { root, clips, names: { idle: "SeatedIdle", welcome: "Wave", introduce: "Introduce" } };
}

export async function loadCharacter(options: { url: string | null; preview: boolean; signal: AbortSignal; reducedMotion: boolean }) {
  let asset: { root: T.Object3D; clips: T.AnimationClip[]; names: Record<string, string> } | null = null;
  if (options.url) {
    if (!options.url.startsWith("/models/") || !/\.glb$/i.test(options.url)) throw Error("Character must be a local /models/*.glb asset");
    const response = await fetch(options.url, { signal: options.signal }); if (!response.ok) throw Error("Character asset unavailable");
    const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "/models/");
    const bounds = new T.Box3().setFromObject(gltf.scene), size = bounds.getSize(new T.Vector3());
    if (!Number.isFinite(size.y) || size.y <= 0) { disposeObject(gltf.scene); throw Error("Invalid character bounds"); }
    gltf.scene.scale.setScalar(characterConfig.height / size.y); gltf.scene.rotation.y = characterConfig.rotation;
    asset = { root: gltf.scene, clips: gltf.animations, names: characterConfig.clips };
  } else if (options.preview) asset = buildPreviewCharacter();
  if (!asset) return null;
  if (options.signal.aborted) { disposeObject(asset.root); return null; }
  asset.root.userData.section = "about";
  const animation = new CharacterAnimationController(asset.root, asset.clips, asset.names, options.reducedMotion);
  return { ...asset, animation, temporary: !options.url, dispose() { animation.dispose(); disposeObject(asset.root); } };
}
