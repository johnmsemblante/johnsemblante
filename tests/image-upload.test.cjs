const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function harness({ token = async () => 'test-token', fetcher, endpoint = 'https://upload.example/upload' } = {}) {
  const previous = { window: global.window, fetch: global.fetch, endpoint: process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL };
  global.window = { setTimeout, clearTimeout };
  global.fetch = fetcher ?? (async () => Response.json({ url: 'https://res.cloudinary.com/demo/image/upload/photo.webp' }));
  if (endpoint) process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL = endpoint; else delete process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL;
  const state = [], cleanup = [], uploaded = [], busy = []; let index = 0;
  const hooks = {
    useState(initial) { const i=index++; if (!(i in state)) state[i]=typeof initial==='function'?initial():initial; return [state[i], value=>{state[i]=typeof value==='function'?value(state[i]):value;}]; },
    useRef(initial) { const i=index++; return state[i]??(state[i]={current:initial}); },
    useId: () => 'test-upload', useEffect(fn) { const i=index++; if (!state[i]) {state[i]=true;cleanup.push(fn());} },
  };
  const out={};
  const source=ts.transpileModule(fs.readFileSync('src/components/admin/image-upload.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','exports',source)(name=>name==='react'?hooks:name==='./admin-gate'?{useAdmin:()=>({user:{getIdToken:token}})}:require(name),out);
  function nodes(n){return !n||typeof n!=='object'?[]:Array.isArray(n)?n.flatMap(nodes):[n,...nodes(n.props?.children)];}
  function render(){index=0;return nodes(out.ImageUpload({onUpload:url=>uploaded.push(url),onBusy:value=>busy.push(value)}));}
  function choose(file){return render().find(n=>n.type==='input').props.onChange({target:{files:file?[file]:[],value:'selected'}});}
  function unmount(){cleanup.splice(0).forEach(fn=>fn?.());}
  function restore(){unmount();global.window=previous.window;global.fetch=previous.fetch;if(previous.endpoint===undefined)delete process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL;else process.env.NEXT_PUBLIC_MEDIA_UPLOAD_URL=previous.endpoint;}
  return {render,choose,uploaded,busy,unmount,restore};
}
const image=()=>new File(['image bytes'],'photo.webp',{type:'image/webp'});

test('shared image upload validates files before authorization or network access',async()=>{
  let tokens=0,requests=0;const h=harness({token:async()=>{tokens++;return 'token';},fetcher:async()=>{requests++;}});
  try{for(const file of [new File([],'empty.png',{type:'image/png'}),new File(['x'],'file.pdf',{type:'application/pdf'}),new File([new Uint8Array(5*1024*1024+1)],'large.jpg',{type:'image/jpeg'})])await h.choose(file);
    assert.equal(tokens,0);assert.equal(requests,0);assert.deepEqual(h.busy,[]);assert.deepEqual(h.uploaded,[]);assert.ok(h.render().some(n=>n.props?.role==='alert'));
  }finally{h.restore();}
});

test('upload sends authenticated multipart data once and restores controls after success',async()=>{
  let finish,calls=0;const h=harness({fetcher:async(url,options)=>{calls++;assert.equal(url,'https://upload.example/upload');assert.equal(options.headers.Authorization,'Bearer test-token');assert.equal(options.credentials,'omit');assert.equal(options.body.get('file').name,'photo.webp');return new Promise(resolve=>finish=resolve);}});
  try{const pending=h.choose(image());await Promise.resolve();assert.equal(h.render().find(n=>n.type==='input').props.disabled,true);await h.choose(image());assert.equal(calls,1);finish(Response.json({url:'https://res.cloudinary.com/demo/image/upload/photo.webp'}));await pending;
    assert.equal(h.uploaded.length,1);assert.deepEqual(h.busy,[true,false]);assert.equal(h.render().find(n=>n.type==='input').props.disabled,false);
  }finally{h.restore();}
});

test('upload failures and unsafe responses do not replace image fields and allow retry',async()=>{
  for(const fetcher of [async()=>Response.json({message:'Upload denied'},{status:403}),async()=>Response.json({url:'https://res.cloudinary.com.evil/image/upload/a'}),async()=>Response.json({url:'https://name:password@res.cloudinary.com/demo/image/upload/a'}),async()=>Response.json({url:'https://res.cloudinary.com/demo/raw/upload/a'}),async()=>{throw Error('Network unavailable');}]){
    const h=harness({fetcher});try{await h.choose(image());assert.deepEqual(h.uploaded,[]);assert.deepEqual(h.busy,[true,false]);assert.ok(h.render().some(n=>n.props?.role==='alert'));assert.equal(h.render().find(n=>n.type==='input').props.disabled,false);}finally{h.restore();}
  }
});

test('unmount aborts pending uploads and ignores late responses; missing setup keeps URL fallback',async()=>{
  let finish,signal;const h=harness({fetcher:async(_url,options)=>{signal=options.signal;return new Promise(resolve=>finish=resolve);}});
  try{const pending=h.choose(image());await Promise.resolve();h.unmount();assert.equal(signal.aborted,true);finish(Response.json({url:'https://res.cloudinary.com/demo/image/upload/photo.webp'}));await pending;assert.deepEqual(h.uploaded,[]);}finally{h.restore();}
  const absent=harness({endpoint:''});try{assert.ok(!absent.render().some(n=>n.type==='input'));}finally{absent.restore();}
});
