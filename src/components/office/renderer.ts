import * as T from "three";
import { buildOfficeModel } from "./model";
import { officeRooms, type RoomId } from "./rooms";

export type OfficeQuality = "high" | "medium" | "low";
export type OfficeRenderer = Awaited<ReturnType<typeof createOfficeRenderer>>;
export async function createOfficeRenderer(host: HTMLElement, options: {
  quality: OfficeQuality; reducedMotion: boolean;
  project: (id: RoomId, x: number, y: number, visible: boolean) => void;
  failed: () => void;
  qualityChanged?: (quality:OfficeQuality) => void;
  signal?: AbortSignal;
}) {
  const renderer = new T.WebGLRenderer({ antialias: options.quality !== "low", alpha: false, powerPreference: "low-power" });
  renderer.setClearColor("#101319"); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = options.quality === "high";renderer.shadowMap.type = T.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  let model:Awaited<ReturnType<typeof buildOfficeModel>>;
  try {model=await buildOfficeModel(options.signal);}catch(error){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();throw error;}
  scene.add(model.root);
  scene.add(new T.HemisphereLight("#c4cdea", "#59402d", .85));
  const key = new T.DirectionalLight("#ffcf99", 2.3);key.position.set(-8,26,2);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-34;key.shadow.camera.right=28;key.shadow.camera.top=24;key.shadow.camera.bottom=-26;
  key.shadow.camera.near=1;key.shadow.camera.far=70;key.shadow.normalBias=.035;key.shadow.bias=-.0002;key.shadow.radius=3;scene.add(key);
  const rim = new T.DirectionalLight("#a7b5e7", .8);rim.position.set(10,14,-18);scene.add(rim);
  // Broad interior fills, with one shadow-casting key light for the entire model.
  for (const [x,z] of [[-10,2],[4,-4],[10,4],[-3,5]]) {
    const light=new T.PointLight("#ffca8b",85,12,2);light.position.set(x,4.5,z);scene.add(light);
  }
  const camera = new T.OrthographicCamera(-25,25,15,-15,.1,160);
  let width=1,height=1,disposed=false,active=true,initialized=false,raf=0,settled=0;
  let quality=options.quality, yaw=0,zoom=1,chosen: RoomId|null=null;
  const target = new T.Vector3(-5,3,0), desiredTarget=target.clone();
  let currentZoom=1;
  const raycaster=new T.Raycaster();
  const floor=new T.Plane(new T.Vector3(0,1,0),-.3);
  const pointer=new T.Vector2();const point=new T.Vector3();
  function project(){
    for(const room of officeRooms){const v=new T.Vector3(...room.anchor).project(camera);options.project(room.id,(v.x*.5+.5)*width,(-v.y*.5+.5)*height,v.z>-1&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1);}
  }
  function draw(time=0){
    raf=0;if(disposed||!active)return;
    const start=performance.now();
    const immediate=options.reducedMotion;
    target.lerp(desiredTarget,immediate?1:.115);currentZoom=T.MathUtils.lerp(currentZoom,zoom,immediate?1:.115);
    const angle=-.68+yaw;camera.position.set(target.x+Math.sin(angle)*57,38,target.z+Math.cos(angle)*57);camera.lookAt(target);
    camera.zoom=currentZoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    renderer.render(scene,camera);project();
    // Lower sustained slow frames once. This changes resolution/shadows, never content.
    if(time && quality!=="low"){
      settled=performance.now()-start>48?settled+1:0;if(settled>8){quality="low";renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;renderer.setSize(width,height,false);options.qualityChanged?.("low");}
    }
    if(target.distanceTo(desiredTarget)>.001||Math.abs(currentZoom-zoom)>.001)request();
  }
  function request(){if(!disposed&&initialized&&active&&!raf)raf=requestAnimationFrame(draw);}
  function resize(){const bounds=host.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);
    const aspect=width/height;const frame=aspect<1.4?34:27;
    camera.left=-frame*aspect/2;camera.right=frame*aspect/2;camera.top=frame/2;camera.bottom=-frame/2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,quality==="high"?1.5:quality==="medium"?1.2:1));renderer.setSize(width,height);request();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const visibility=new IntersectionObserver(([entry])=>{active=entry.isIntersecting&&!document.hidden;if(active)request();else if(raf){cancelAnimationFrame(raf);raf=0;}},{threshold:0});visibility.observe(host);
  function tabVisibility(){active=!document.hidden&&host.getBoundingClientRect().bottom>0&&host.getBoundingClientRect().top<innerHeight;if(active)request();else if(raf){cancelAnimationFrame(raf);raf=0;}}
  document.addEventListener("visibilitychange",tabVisibility);
  function lost(event:Event){event.preventDefault();options.failed();}
  renderer.domElement.addEventListener("webglcontextlost",lost);
  function highlight(id:RoomId|null){for(const [key,mesh] of model.highlights)mesh.visible=key===(id??chosen);request();}
  function pick(clientX:number,clientY:number):RoomId|null{
    const bounds=host.getBoundingClientRect();pointer.set((clientX-bounds.left)/width*2-1,-(clientY-bounds.top)/height*2+1);raycaster.setFromCamera(pointer,camera);
    if(!raycaster.ray.intersectPlane(floor,point))return null;
    let nearest:RoomId|null=null;let distance=3.7;
    for(const room of officeRooms){const d=Math.hypot(point.x-room.target[0],point.z-room.target[2]);if(d<distance){distance=d;nearest=room.id;}}
    return nearest;
  }
  resize();camera.position.set(target.x+Math.sin(-.68)*57,41,target.z+Math.cos(-.68)*57);camera.lookAt(target);camera.updateMatrixWorld();
  try {await renderer.compileAsync(scene,camera);}catch(error){model.dispose();resizeObserver.disconnect();visibility.disconnect();document.removeEventListener("visibilitychange",tabVisibility);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();throw error;}
  initialized=true;
  if(options.signal?.aborted){model.dispose();resizeObserver.disconnect();visibility.disconnect();document.removeEventListener("visibilitychange",tabVisibility);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();throw new DOMException("Office loading cancelled","AbortError");}
  draw();
  return {
    select(id:RoomId|null){chosen=id;const room=officeRooms.find(r=>r.id===id);desiredTarget.set(...(room?room.target:[-5,3,0]) as [number,number,number]);if(room){desiredTarget.x+=3;desiredTarget.y=1.5;zoom=1.65;}else{zoom=1;yaw=0;}highlight(id);request();},
    highlight,pick,
    control(action:"left"|"right"|"in"|"out"|"reset"){
      if(action==="reset"){chosen=null;desiredTarget.set(-5,3,0);yaw=0;zoom=1;highlight(null);}
      if(action==="left")yaw=Math.max(-.3,yaw-.12);
      if(action==="right")yaw=Math.min(.3,yaw+.12);
      if(action==="in")zoom=Math.min(2.2,zoom+.18);
      if(action==="out")zoom=Math.max(.82,zoom-.18);request();
    },
    quality(next:OfficeQuality){quality=next;renderer.shadowMap.enabled=next==="high";resize();},
    info(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,quality};},
    dispose(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);resizeObserver.disconnect();visibility.disconnect();document.removeEventListener("visibilitychange",tabVisibility);renderer.domElement.removeEventListener("webglcontextlost",lost);model.dispose();key.shadow.map?.dispose();renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();},
  };
}
