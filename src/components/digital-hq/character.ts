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
  const skin = new T.MeshStandardMaterial({ color: "#b67c5c", roughness: .63 });
  const dark = new T.MeshStandardMaterial({ color: "#11121c", roughness: .9 });
  const hair = new T.MeshStandardMaterial({ color: "#160f15", roughness: .52 });
  const earShade = new T.MeshStandardMaterial({ color: "#9c594b", roughness: .75 });
  const curls = new T.MeshStandardMaterial({ color: "#291c24", roughness: .49 });
  const wristband = new T.MeshStandardMaterial({ color: "#23263b", metalness: .27, roughness: .42 });
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
  const eyes = bone("Eyes", [0, .475, .414], head);
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
    a.sphere(0, .12, 0, .78, .85, .45, dark, 24);
    a.sphere(0, .78, -.12, .48, .25, .35, dark);
    a.tube([[-.46, .71, .2], [-.28, .57, .37], [0, .51, .44], [.28, .57, .37], [.46, .71, .2]], .045, dark, 25);
    for (const side of [-1, 1]) {
      a.tube([[side * .53, .36, .29], [side * .42, .2, .35], [side * .38, -.02, .36]], .016, seams, 12);
      a.box(side * .22, .18, .449, .036, .075, .027, accent, .007);
    }
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
    const face = new T.SphereGeometry(1, 40, 28);
    const vertices = face.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const jaw = T.MathUtils.smoothstep(y, -.9, -.15);
      vertices.setXYZ(i, x * (.39 + .086 * jaw), y * .594 + .405, z * .414 + .037 + Math.max(0, -y) * .047);
    }
    face.computeVertexNormals();
    a.add(face, skin, [0, 0, 0]);
    for (const side of [-1, 1]) {
      a.sphere(side * .451, .402, .034, .084, .139, .079, skin);
      a.sphere(side * .487, .405, .095, .038, .081, .016, earShade);
      a.tube([[side * .084, .476, .438], [side * .176, .512, .441], [side * .272, .477, .403]], .014, skin, 11);
      a.tube([[side * .077, .565, .445], [side * .173, .588, .439], [side * .286, .554, .398]], .019, hair, 11);
      a.sphere(side * .053, .315, .472, .025, .018, .017, earShade);
    }
    a.sphere(0, .39, .454, .057, .111, .05, skin);
    a.sphere(0, .341, .48, .071, .045, .046, skin);
    a.tube([[-.125, .226, .424], [-.057, .209, .454], [.045, .21, .456], [.129, .236, .409]], .012, lips, 16);
    a.sphere(0, .043, .381, .119, .103, .037, hair);
    for (let i = 0; i < 26; i++) {
      const x = Math.sin(i * 2.399) * .103, y = .03 + Math.cos(i * 1.73) * .084;
      a.tube([[x, y, .394], [x - .009, y - .028, .401], [x - .006, y - .05, .393]], .004, curls, 4);
    }
    a.sphere(0, .775, -.014, .477, .323, .418, hair, 26);
    for (let i = 0; i < 96; i++) {
      const angle = i * 2.399, t = Math.sqrt((i + .5) / 96);
      const x = Math.cos(angle) * t * .48, z = Math.sin(angle) * t * .42 - .018;
      const y = .756 + Math.sqrt(1 - t * t) * .348;
      a.sphere(x, y, z, .077, .072, .075, hair, 9);
      const curl = new T.TorusGeometry(.045, .012, 6, 12, Math.PI * 1.65);
      a.add(curl, curls, [x, y + .042, z + .025], [-.55 + Math.cos(angle) * .55, Math.sin(angle) * .55, angle]);
    }
  });
  part(eyes, a => {
    for (const side of [-1, 1]) {
      a.sphere(side * .176, 0, 0, .094, .032, .033, white);
      a.sphere(side * .174, 0, .03, .034, .032, .012, eye);
      a.sphere(side * .162, .012, .04, .009, .008, .006, white);
    }
  });
  for (const [arm, hand, side] of [[leftArm, leftHand, -1], [rightArm, rightHand, 1]] as const) {
    part(arm, a => { a.tube([[0, 0, 0], [side * .14, -.3, .09], [side * .2, -.62, .3]], .2, dark, 12); });
    part(hand, a => {
      if (side === -1) {
        // Elbow beside the laptop, with the folded hand under the chin.
        a.tube([[0, 0, 0], [.10, .12, .10], [.25, .45, .24]], .134, dark, 14);
        a.tube([[.25, .45, .24], [.42, .75, .37], [.60, .99, .41]], .102, skin, 14);
        a.sphere(.648, 1.045, .417, .144, .106, .104, skin);
        for (let i = 0; i < 4; i++) {
          const x = .578 + i * .044;
          a.tube([[x, .99, .467], [x + .01, 1.073, .486], [x + .018, 1.103, .458]], .023, skin, 7);
        }
      } else {
        a.tube([[0, 0, 0], [-.05, -.08, .32], [-.17, -.19, .59]], .153, dark, 14);
        a.box(-.14, -.132, .50, .26, .202, .106, seams, .03);
        a.sphere(-.245, -.183, .705, .143, .076, .173, skin);
        a.box(-.205, -.095, .597, .127, .047, .13, wristband, .025);
        a.box(-.205, -.068, .597, .098, .012, .103, eye, .015);
      }
    });
  }
  for (const leg of [leftLeg, rightLeg]) part(leg, a => { a.tube([[0, 0, 0], [0, -.02, .62], [0, -.35, .87], [0, -1.1, .87]], .23, dark, 15); a.sphere(0, -1.23, 1.03, .24, .17, .43, seams); a.sphere(0, -1.17, 1.05, .22, .13, .36, dark); });
  const skeleton = new T.Skeleton(bones);
  for (const [material, parts] of materialParts) { const geometry = mergeGeometries(parts); parts.forEach(g => g.dispose()); if (!geometry) continue; const mesh = new T.SkinnedMesh(geometry, material); mesh.bind(skeleton); mesh.castShadow = true; mesh.frustumCulled = false; root.add(mesh); }
  const rotation = (name: string, axis: string, times: number[], values: number[]) => new T.NumberKeyframeTrack(`${name}.rotation[${axis}]`, times, values);
  const clips = [
    new T.AnimationClip("SeatedIdle", 4, [new T.NumberKeyframeTrack("Eyes.scale[y]", [0, 2.81, 2.88, 2.99, 4], [1, 1, .055, 1, 1]), rotation("Chest", "x", [0, 2, 4], [0, .012, 0]), rotation("Head", "y", [0, 2, 4], [-.018, .018, -.018])]),
    new T.AnimationClip("Wave", 2.5, [rotation("RightArm", "z", [0, .5, 1, 1.3, 1.6, 1.9, 2.5], [0, 2.25, 2.1, 2.4, 2.1, 2.4, 0])]),
    new T.AnimationClip("Introduce", 2.4, [rotation("Head", "y", [0, .8, 1.6, 2.4], [0, -.08, .06, 0]), rotation("LeftArm", "z", [0, .8, 1.6, 2.4], [0, -.25, -.25, 0])]),
  ];
  root.scale.setScalar(1.43);
  root.position.set(-.32, -.14, .28);
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
