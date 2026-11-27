import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { officeRooms } from "./rooms";

// Original procedural assets. Geometry is batched by material after construction.
// No model downloads, external asset hosts, or runtime furniture dependencies.
export async function buildOfficeModel(signal?:AbortSignal) {
  const root = new T.Group();
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const textures: T.Texture[] = [];
  async function checkpoint(){await new Promise(resolve=>setTimeout(resolve,0));if(signal?.aborted)throw new DOMException("Office loading cancelled","AbortError");}
  try {
  let transform = new T.Matrix4();
  let seed = 7301;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const material = (color: string, extra: T.MeshStandardMaterialParameters = {}) => new T.MeshStandardMaterial({ color, roughness: .78, ...extra });
  const m = {
    wall: material("#eed8bc"), wallEdge: material("#f7e8d2"), exterior: material("#29333f"),
    floor: material("#78716a"), tile: material("#d8c6ac"), grout: material("#a89c89"),
    black: material("#1c2329"), metal: material("#333d44", { metalness: .65, roughness: .4 }),
    silver: material("#a9aaa4", { metalness: .65, roughness: .35 }), white: material("#f3e9d8"),
    fabric: material("#a89a89"), cushion: material("#c6b6a0"), leather: material("#383a36"),
    wood: material("#a76a38"), oak: material("#c58d53"), darkWood: material("#6a432c"),
    gold: material("#c99a53", { metalness: .5, roughness: .45 }), pot: material("#bb7c4e"),
    leaf: material("#587534"), leafLight: material("#8a9a3d"), leafDark: material("#344e2e"),
    bark: material("#604735"), soil: material("#39382a"), pavement: material("#41444c"),
    asphalt: material("#0e1420"), marking: material("#7b8087"), grass: material("#304734"),
    skin: material("#c29776"),
    warm: material("#ffdfaa", { emissive: "#ffbd70", emissiveIntensity: 2.2 }),
    cyan: material("#7dd2e9", { emissive: "#49aabd", emissiveIntensity: .7 }),
    purple: material("#a87cce", { emissive: "#8f45c0", emissiveIntensity: .8 }),
    blue: material("#2671a4"), red: material("#9d3d2c"), yellow: material("#d8b14f"),
    glass: material("#afc6c5", { transparent: true, opacity: .24, metalness: .2, roughness: .22, depthWrite: false, side: T.DoubleSide }),
  };
  function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d")!);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4;
    textures.push(texture); return texture;
  }
  const grain = canvasTexture(512, 256, c => {
    c.fillStyle = "#c3a17d"; c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 700; i++) {
      c.strokeStyle = `rgba(${random() > .5 ? "75,39,15" : "245,222,183"},${random() * .18})`;
      c.lineWidth = random() * 1.8; const y = random() * 256;
      c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(140, y + random() * 4, 350, y - random() * 5, 512, y); c.stroke();
    }
  });
  m.wood.map = grain; m.oak.map = grain; m.darkWood.map = grain;
  const carpet = canvasTexture(256, 256, c => {
    c.fillStyle = "#b6b0a7"; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16000; i++) { c.fillStyle = random() > .5 ? "#ffffff13" : "#00000013"; c.fillRect(random()*256,random()*256,1,1); }
    c.strokeStyle = "#332e2419"; c.strokeRect(0, 0, 256, 256);
  });
  carpet.wrapS = carpet.wrapT = T.RepeatWrapping; carpet.repeat.set(18, 12); m.floor.map = carpet;
  const screenTextures = ["studio", "code", "lab", "arcade"].map((kind, index) => {
    const map = canvasTexture(512, 320, c => {
      c.fillStyle = "#131f32"; c.fillRect(0, 0, 512, 320);
      if (kind === "arcade") {
        const g = c.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, "#29154d");g.addColorStop(1, "#181831"); c.fillStyle = g;c.fillRect(0,0,512,320);
        for(let i=0;i<18;i++){const x=i*31; const h=60+random()*120;c.fillStyle=i%2?"#3a2259":"#21415a";c.fillRect(x,260-h,27,h);c.fillStyle="#db75f0";for(let y=0;y<h-8;y+=16)c.fillRect(x+6,270-h+y,3,6);}
        c.strokeStyle="#7de6ee";c.lineWidth=3;c.beginPath();c.moveTo(0,277);c.lineTo(512,277);c.stroke();
        c.fillStyle="#a8e7ed";c.fillRect(239,236,19,29);c.fillStyle="#edd19a";c.fillRect(244,224,13,14);
        c.textAlign="center";c.fillStyle="#f9e5ff";c.font="bold 38px sans-serif";c.fillText("NEON DASH",256,61);c.font="16px monospace";c.fillStyle="#74dbea";c.fillText("A LITTLE SIDE QUEST",256,91);
      } else if (kind === "code") {
        c.fillStyle="#202a39";c.fillRect(0,0,512,28);c.fillStyle="#0e1623";c.fillRect(0,28,100,292);
        for(let i=0;i<18;i++){c.fillStyle=["#83c9cd","#b6a0e3","#d3ac78"][i%3]; c.fillRect(120+(i%3)*17,44+i*13,80+random()*180,4);c.fillStyle="#3f5268";c.fillRect(12,44+i*13,40+random()*35,3);}
      } else {
        c.fillStyle="#f1ede4";c.fillRect(0,0,512,320);c.fillStyle="#243c42";c.fillRect(0,0,512,31);
        c.fillStyle=index===0?"#305d63":"#795d45";c.fillRect(16,47,480,130);c.fillStyle="#ecdfca";c.font="bold 31px sans-serif";c.fillText(index===0?"Made for the web.":"Ideas into things.",34,101);
        c.font="14px sans-serif";c.fillText("DESIGN   /   BUILD   /   EXPLORE",35,131);
        for(let i=0;i<3;i++){c.fillStyle=["#bdc7ba","#c8b49d","#93aaad"][i];c.fillRect(16+i*164,191,150,75);c.fillStyle="#80908a";c.fillRect(16+i*164,279,110,6);c.fillRect(16+i*164,294,85,4);}
      }
    });
    return material("#ffffff", { map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: .24, roughness: .55 });
  });
  const sign = (text: string, background: string, color: string, width = 512) => material("#ffffff", {map:canvasTexture(width,128,c=>{c.fillStyle=background;c.fillRect(0,0,width,128);c.font="500 43px sans-serif";c.fillStyle=color;c.textAlign="center";c.fillText(text,width/2,81);}),roughness:.6});
  const logo = sign("js.   JOHN SEMBLANTE", "#e8d5b9", "#504335", 768);
  const arcadeSign = sign("NEON DASH", "#20172e", "#dab4ef");
  const bookColors = [m.blue, m.red, m.oak, m.yellow, m.leaf, m.white];
  const shadowMap = canvasTexture(64,64,c=>{const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,"#00000080");g.addColorStop(.35,"#00000050");g.addColorStop(1,"#00000000");c.fillStyle=g;c.fillRect(0,0,64,64);});
  const shadowMat = new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  function add(geometry: T.BufferGeometry, mat: T.Material, x: number, y: number, z: number, rotation = new T.Euler()) {
    const matrix = new T.Matrix4().compose(new T.Vector3(x,y,z), new T.Quaternion().setFromEuler(rotation), new T.Vector3(1,1,1));
    geometry.applyMatrix4(matrix.premultiply(transform));
    if (geometry.index) { const nonIndexed=geometry.toNonIndexed();geometry.dispose();geometry=nonIndexed; }
    for(const key of Object.keys(geometry.attributes)) if(!["position","normal","uv"].includes(key)) geometry.deleteAttribute(key);
    const batch=batches.get(mat)??[];batch.push(geometry);batches.set(mat,batch);
  }
  function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,r=.035) {
    add(r>0?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),mat,x,y,z);
  }
  function cylinder(x:number,y:number,z:number,rt:number,rb:number,h:number,mat:T.Material,n=12) {add(new T.CylinderGeometry(rt,rb,h,n),mat,x,y,z);}
  function sphere(x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:T.Material) {
    const g=new T.SphereGeometry(1,8,6);g.scale(sx,sy,sz);add(g,mat,x,y,z);
  }
  function tube(points:T.Vector3[],radius:number,mat:T.Material) {add(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,radius,5,false),mat,0,0,0);}
  function place(x:number,y:number,z:number,rotation:number,build:()=>void) {
    const previous=transform; transform=transform.clone().multiply(new T.Matrix4().makeRotationY(rotation).setPosition(x,y,z));build();transform=previous;
  }
  function shadow(x:number,z:number,w:number,d:number,y=.036){const g=new T.PlaneGeometry(w,d);add(g,shadowMat,x,y,z,new T.Euler(-Math.PI/2,0,0));}
  function plant(x:number,z:number,scale=1,y=0) {
    place(x,y,z,0,()=>{
      cylinder(0,.24*scale,0,.22*scale,.16*scale,.48*scale,m.pot);
      cylinder(0,.48*scale,0,.2*scale,.2*scale,.035,m.soil);
      for(let i=0;i<9;i++){
        const angle=i*2.399, length=(.58+random()*.45)*scale;
        const end=new T.Vector3(Math.cos(angle)*.4*scale,.6*scale+length,Math.sin(angle)*.4*scale);
        tube([new T.Vector3(0,.43*scale,0),new T.Vector3(end.x*.35,.85*scale,end.z*.35),end],.018*scale,m.leafDark);
        const leaf=new T.SphereGeometry(1,7,5);leaf.scale(.1*scale,.42*scale,.045*scale);
        const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.cos(angle)*.7,.7,Math.sin(angle)*.7).normalize());leaf.applyQuaternion(q);add(leaf,i%2?m.leaf:m.leafLight,end.x*.9,end.y-.12*scale,end.z*.9);
      }
      shadow(0,0,1.5*scale,1.5*scale);
    });
  }
  function chair(x:number,z:number,rotation=0,executive=false) {
    place(x,0,z,rotation,()=>{
      const fabric=executive?m.leather:m.black;
      cylinder(0,.43,0,.055,.07,.58,m.silver);
      for(let i=0;i<5;i++)place(0,0,0,i*Math.PI*2/5,()=>{box(0,.14,.25,.07,.065,.55,m.metal);sphere(0,.09,.49,.085,.085,.06,m.black);});
      box(0,.77,0,.84,.18,.78,fabric,.08);box(0,1.25,.36,.83,.92,.14,fabric,.07);
      box(0,1.25,.275,.69,.72,.025,executive?m.leather:m.metal,.01);
      for(const a of [-1,1]){box(a*.45,.95,.12,.055,.42,.055,m.metal);box(a*.45,1.13,.04,.12,.08,.55,fabric);}
      if(executive)box(0,1.83,.34,.53,.26,.16,m.leather,.07);
      shadow(0,0,1.65,1.65);
    });
  }
  function monitor(x:number,y:number,z:number,kind=0,rotation=0) {
    place(x,y,z,rotation,()=>{
      box(0,.025,.06,.46,.04,.32,m.silver);box(0,.23,0,.065,.43,.07,m.metal);
      box(0,.61,0,1.14,.72,.065,m.black,.025);box(0,.62,.037,1.04,.62,.008,screenTextures[kind],0);
      cylinder(.43,.286,.037,.012,.012,.008,m.cyan,6);
    });
  }
  function keyboard(x:number,y:number,z:number){box(x,y,z,.7,.035,.23,m.metal,.02);for(let row=0;row<3;row++)for(let col=0;col<10;col++)box(x-.3+col*.065,y+.024,z-.07+row*.06,.048,.008,.04,m.silver,.004);box(x+.52,y,z,.13,.06,.21,m.black,.05);}
  function desk(x:number,z:number,rotation=0,kind=0,double=true){
    place(x,0,z,rotation,()=>{
      shadow(0,0,3.5,2.5);box(0,1.1,0,2.9,.13,1.25,m.white,.045);box(0,1.025,0,2.84,.025,1.16,m.oak,.008);
      for(const a of [-1,1]){box(a*1.22,.52,0,.07,1.02,1.02,m.white);box(a*1.22,.06,0,.32,.08,1.1,m.metal);}
      box(-.9,.6,.08,.62,.9,.93,m.white);for(let i=0;i<3;i++){box(-.9,.36+i*.27,.557,.57,.23,.025,m.wallEdge);box(-.9,.4+i*.27,.58,.15,.025,.025,m.metal);}
      monitor(double?-.55:0,1.18,-.27,kind);if(double)monitor(.59,1.18,-.25,1,-.13);
      keyboard(0,1.19,.35);cylinder(1.14,1.27,.31,.085,.075,.2,m.white);cylinder(1.14,1.374,.31,.065,.065,.006,m.darkWood);
      box(-1.1,1.21,.36,.36,.07,.26,m.oak);box(-1.1,1.25,.36,.33,.025,.25,m.white);
      chair(.1,1.25,0);plant(1.23,-.35,.36,1.17);
    });
  }
  function partition(x:number,z:number,w:number,rotation=0){place(x,0,z,rotation,()=>{
    box(0,.55,0,w,1.1,.12,m.wall);box(0,1.8,0,w,1.4,.045,m.glass,0);
    for(const a of [-1,0,1])box(a*w/2,1.3,0,.055,2.6,.085,m.black,0);
    box(0,2.59,0,w,.055,.085,m.black,0);box(0,1.13,0,w,.035,.07,m.metal,0);
  });}
  function wall(x:number,z:number,w:number,rotation=0){place(x,0,z,rotation,()=>{box(0,1.42,0,w,2.84,.18,m.wall,.015);box(0,2.85,0,w+.04,.06,.22,m.wallEdge,.01);box(0,.12,.1,w,.13,.025,m.white,.005);box(0,2.66,.13,w-.2,.035,.035,m.warm,.005);});}
  function sofa(x:number,z:number,rotation=0){place(x,0,z,rotation,()=>{
    shadow(0,0,4.5,2.3);for(const a of [-1,1])for(const b of [-1,1])cylinder(a*1.4,.15,b*.48,.045,.045,.3,m.gold);
    box(0,.48,0,3.5,.5,1.35,m.fabric,.12);box(0,1.03,-.53,3.48,.87,.27,m.fabric,.1);
    for(const a of [-1,1])box(a*1.68,.84,.02,.3,.78,1.37,m.fabric,.1);
    for(let i=0;i<3;i++){box(-1.03+i*1.03,.77,.02,.98,.2,1,m.cushion,.08);box(-1.03+i*1.03,1.09,-.37,.96,.62,.22,m.cushion,.08);}
    place(1.1,0,0,.18,()=>box(0,1.03,-.17,.52,.5,.18,m.oak,.1));
  });}
  function person(x:number,z:number,rotation=0){place(x,0,z,rotation,()=>{
    const skin=m.skin;
    sphere(0,1.38,0,.24,.28,.23,skin);sphere(0,1.55,-.03,.255,.2,.24,m.darkWood);
    box(0,.99,.02,.45,.58,.31,m.exterior,.1);
    for(const a of [-1,1]){tube([new T.Vector3(a*.2,1.17,0),new T.Vector3(a*.3,.96,-.25),new T.Vector3(a*.23,1.14,-.5)],.075,m.exterior);sphere(a*.23,1.14,-.5,.08,.07,.08,skin);box(a*.13,.68,-.17,.16,.18,.62,m.black,.06);box(a*.13,.45,-.42,.16,.46,.17,m.black,.04);}
  });}
  await checkpoint();
  // Compact architectural plinth for the building-only overview.
  box(0,-.32,0,30.1,.32,18.4,m.black,.2);
  box(0,-.08,0,29.5,.35,17.8,m.exterior,.12);
  box(0,-.02,0,28.5,.45,16.6,m.exterior,.08);box(0,.23,0,28,.08,16,m.floor,.01);
  wall(0,-8,28);wall(-14,-3,10,Math.PI/2);
  box(0,.63,8.1,28.3,.95,.2,m.exterior);box(0,1.13,8.1,28.4,.07,.25,m.wallEdge);
  box(14.1,.63,0,.2,.95,16.4,m.exterior);box(14.1,1.13,0,.25,.07,16.5,m.wallEdge);
  // Rooms and connected circulation, with purposeful door openings.
  partition(-5,-4.3,7.4,Math.PI/2);partition(.2,-4.4,7.2,Math.PI/2);
  partition(8,-4.5,7,Math.PI/2);partition(2.7,-.8,5.1);partition(11,-.8,6);
  wall(-9.6,-1.9,8.7);partition(-7,1.5,6.6,Math.PI/2);
  partition(-3,2,4);partition(4,2,4);partition(8,5.2,5.8,Math.PI/2);
  wall(-5,6.1,3.8,Math.PI/2);wall(1.6,6.1,3.8,Math.PI/2);
  await checkpoint();
  // Reception tile and front desk.
  box(-10.4,.282,5.15,7.1,.018,5.7,m.tile,0);
  for(let x=-13.7;x<-7;x+=.8)box(x,.296,5.15,.012,.009,5.6,m.grout,0);
  for(let z=2.4;z<8;z+=.8)box(-10.4,.296,z,7,.009,.012,m.grout,0);
  place(-10,0,6,0,()=>{
    shadow(0,0,5.1,2.5);box(0,.86,0,4.7,1.18,1.05,m.oak,.06);box(0,1.5,0,4.92,.14,1.18,m.white,.06);
    for(let x=-2.2;x<2.3;x+=.16)box(x,.88,.54,.055,1.08,.035,m.darkWood,.005);
    box(0,.98,.568,1.55,.4,.025,m.wallEdge,.015);box(0,.98,.588,1.4,.3,.01,sign("WELCOME", "#ebd9bd", "#68503b"),0);
    monitor(-.8,1.58,-.1,0,Math.PI);keyboard(-.8,1.58,-.35);plant(1.85,0,.43,1.57);person(-.85,-.8,Math.PI);
  });
  box(-12,2.05,-7.88,3.3,.65,.02,logo,0);
  plant(-13.2,7.15,1.2);plant(-7.6,3.2,.9);
  await checkpoint();
  // Reading nook: open bookshelf, individually varied books, reading table.
  place(-13.48,0,.3,Math.PI/2,()=>{
    box(0,1.3,0,3.7,2.5,.38,m.darkWood);for(const a of [-1,1])box(a*1.85,1.4,.18,.09,2.8,.57,m.oak);
    for(let row=0;row<4;row++){const y=.38+row*.62;box(0,y,.13,3.7,.08,.67,m.oak);let x=-1.68;while(x<1.65){const w=.09+random()*.1;const h=.31+random()*.22;box(x,y+.06+h/2,.24,w,h,.34,bookColors[Math.floor(random()*bookColors.length)],.006);box(x,y+.1,.415,w*.7,.018,.008,m.white,0);x+=w+.055;}}
  });
  cylinder(-10.4,.82,.7,1,1,.1,m.oak,32);cylinder(-10.4,.44,.7,.12,.12,.7,m.black);cylinder(-10.4,.12,.7,.52,.52,.07,m.black);
  chair(-10.2,2,0);box(-10.4,.91,.8,.65,.05,.45,m.blue);plant(-8.05,-.8,.8);
  await checkpoint();
  // Lounge, coffee table, TV and recreation.
  sofa(-10,-5.2,0);box(-10,.62,-3.5,2.5,.13,.9,m.oak,.12);
  for(const x of [-10.8,-9.2])for(const z of [-3.75,-3.25])cylinder(x,.35,z,.035,.05,.5,m.gold);
  box(-10,.72,-3.5,.7,.04,.43,m.white);cylinder(-9.4,.77,-3.5,.1,.09,.2,m.white);
  box(-10,1.5,-7.85,3.7,1.7,.07,m.black,.05);box(-10,1.5,-7.8,3.5,1.5,.01,screenTextures[0],0);
  plant(-13,-6.8,1.25);plant(-7,-6.9,1.1);
  await checkpoint();
  // Arcade cabinets with angled panels, sticks, controls and lit marquees.
  for(let i=0;i<2;i++)place(-3.8+i*2.05,0,-6.9,-.08+i*.16,()=>{
    shadow(0,.2,2.4,2.6);box(0,1,0,1.25,1.8,1.02,m.black,.07);box(0,.42,.55,1.12,.5,.12,m.purple);
    for(const a of [-1,1])box(a*.62,1.48,0,.1,2.45,1.14,m.exterior,.035);
    box(0,2.51,-.05,1.34,.36,1.2,m.black,.06);box(0,2.51,.56,1.17,.24,.012,arcadeSign,0);
    box(0,1.9,.35,1.1,.84,.09,m.black,.02);box(0,1.9,.403,.98,.7,.008,screenTextures[3],0);
    box(0,1.36,.55,1.25,.15,.6,m.purple,.035);cylinder(-.27,1.51,.57,.025,.025,.2,m.metal);sphere(-.27,1.64,.57,.07,.07,.07,m.red);
    for(let a=0;a<3;a++)cylinder(.1+a*.14,1.46,.64,.05,.05,.04,a%2?m.cyan:m.yellow,10);
    box(-.47,1.87,.46,.018,.65,.016,m.cyan,0);box(.47,1.87,.46,.018,.65,.016,m.purple,0);
  });
  // Table tennis at the corridor edge, detailed net and paddles.
  box(-3.2,1.04,-2.9,2.5,.1,1.5,m.blue,.02);
  for(const x of [-4.1,-2.3])for(const z of [-3.4,-2.4])box(x,.65,z,.05,.75,.05,m.metal);
  for(const z of [-3.63,-2.17])box(-3.2,1.098,z,2.42,.006,.025,m.white,0);
  box(-3.2,1.1,-2.9,2.42,.006,.025,m.white,0);box(-3.2,1.26,-2.9,.035,.31,1.6,m.white,0);
  for(let z=-3.6;z<-2.1;z+=.1)box(-3.2,1.26,z,.038,.29,.009,m.metal,0);
  await checkpoint();
  // Development studio, executive office and tools.
  desk(2.25,-6.9,0,0);await checkpoint();desk(5.9,-6.9,0,1);await checkpoint();desk(3.2,-2.65,Math.PI,0);
  person(2.35,-5.6,0);person(5.9,-5.6,0);plant(7,-7.1,1.2);
  desk(11,-5.6,0,2,true);person(11,-4.25,0);sofa(11.2,-2.05,Math.PI);plant(13.1,-7,.95);
  await checkpoint();
  // Framed studio mood boards and task cards.
  for(let i=0;i<3;i++){box(.36,1.84,-6.9+i*1.6,.03,.85,1.1,m.oak);box(.38,1.84,-6.9+i*1.6,.01,.73,.99,m.white);}
  desk(-1.7,5.8,Math.PI,2);person(-1.8,4.5,Math.PI);plant(.65,7.2,.95);
  await checkpoint();
  box(-4.87,1.9,6,.025,.9,2.5,m.white);for(let i=0;i<12;i++)box(-4.84,1.65+(i%3)*.23,5.12+Math.floor(i/3)*.48,.012,.17,.34,[m.yellow,m.blue,m.red,m.leaf][i%4],0);
  desk(4.6,6,Math.PI,1,true);person(4.5,4.7,Math.PI);plant(7,7.2,1.1);
  await checkpoint();
  // Utility server racks with glass fronts, vents, cabling and status lamps.
  for(let i=0;i<2;i++)place(6.45+i*1.04,0,.32,0,()=>{
    box(0,1.23,0,.85,1.95,.76,m.black,.04);box(0,1.23,.395,.76,1.79,.02,m.metal,.01);
    for(let j=0;j<7;j++){box(0,.47+j*.22,.42,.65,.16,.05,m.black,.01);for(let k=0;k<5;k++)box(-.22+k*.07,.47+j*.22,.452,.018,.05,.01,m.silver,0);box(.24,.47+j*.22,.455,.05,.025,.008,j%3?m.cyan:m.yellow,0);}
    box(0,1.3,.47,.77,1.82,.018,m.glass,0);
  });
  // Conference room, oval boardroom table, chairs and presentation screen.
  place(11.15,0,3.9,0,()=>{
    shadow(0,0,4.6,5.9);const table=new T.CylinderGeometry(1,1,.14,40);table.scale(1.25,1,2.35);add(table,m.wood,0,1.15,0);
    for(const z of [-1.3,1.3])box(0,.69,z,.5,.92,.66,m.black,.045);
    for(let i=0;i<3;i++){chair(-1.75,-1.45+i*1.4,Math.PI/2,true);chair(1.75,-1.45+i*1.4,-Math.PI/2,true);}
    chair(0,-2.8,Math.PI,true);chair(0,2.8,0,true);
    for(let i=0;i<3;i++){box(-.55,1.24,-1.2+i*1.2,.42,.02,.6,m.white);cylinder(.65,1.32,-1.2+i*1.2,.065,.06,.18,m.white);}
    plant(0,0,.35,1.23);
  });
  plant(13.2,.1,1.1);plant(9.1,7.25,1.05);
  await checkpoint();
  // Merge static meshes: furniture detail does not multiply renderer draw calls.
  for(const [mat,geometries] of batches){
    const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
    if(!merged)continue;
    const mesh=new T.Mesh(merged,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;root.add(mesh);
    await checkpoint();
  }
  batches.clear();
  const highlights=new Map<string,T.Mesh>();
  for(const room of officeRooms){
    const g=new T.RingGeometry(1.5,1.55,48);g.rotateX(-Math.PI/2);
    const mesh=new T.Mesh(g,new T.MeshBasicMaterial({color:room.accent,transparent:true,opacity:.8,depthWrite:false}));
    mesh.position.set(room.target[0],.32,room.target[2]);mesh.visible=false;root.add(mesh);highlights.set(room.id,mesh);
  }
  return {root,highlights,dispose(){root.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(mat=>mat.dispose());}});textures.forEach(texture=>texture.dispose());}};
  }catch(error){
    for(const [mat,geometries] of batches){geometries.forEach(g=>g.dispose());mat.dispose();}
    textures.forEach(texture=>texture.dispose());
    root.traverse(object=>{if(object instanceof T.Mesh)object.geometry.dispose();});
    throw error;
  }
}
