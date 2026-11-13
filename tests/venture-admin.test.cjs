const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function loader(mocks={}){const cache={};return function load(file){file=path.resolve(file);if(cache[file])return cache[file];const out={};cache[file]=out;new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(name=>{if(name in mocks)return mocks[name];if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);return load(['.ts','.tsx'].map(ext=>base+ext).find(fs.existsSync));}return require(name);},out);return out;};}
const load=loader(),model=load('src/lib/venture-model.ts'),{ventures}=load('src/ventures/registry.ts');
const fixture=()=>({...ventures[0],slug:'test-venture',name:'Test venture'});
test('all source ventures validate without changing their images, and unsafe nested input is rejected',()=>{
  for(const v of ventures){assert.equal(model.validateVenture(v),'',v.slug);assert.deepEqual(model.parseVenture(JSON.stringify(v),v.slug),v);}
  for(const v of [{...fixture(),slug:'view'},{...fixture(),theme:'unknown'},{...fixture(),contact:{label:'Bad',url:'javascript:alert(1)'}},{...fixture(),hero:{src:'//evil.invalid/a',alt:'Bad',width:100,height:100}},{...fixture(),offerings:[{title:'Title',description:'Description',price:NaN}]},{...fixture(),seo:{title:'x'.repeat(161)}},{...fixture(),gallery:[{src:'/a',alt:'A',title:'A',width:100,height:100,thumbnailSrc:'/a',sourceUrl:'javascript:alert(1)'}]}])assert.notEqual(model.validateVenture(v),'');
});
test('public merging updates, creates and removes source ventures and rejects invalid content',()=>{
  const updated={...ventures[0],name:'Edited coffee'},created=fixture();
  const result=model.mergeVentures(ventures,[{slug:updated.slug,deleted:false,content:JSON.stringify(updated)},{slug:ventures[1].slug,deleted:true},{slug:created.slug,deleted:false,content:JSON.stringify(created)}]);
  assert.equal(result.find(v=>v.slug===updated.slug).name,'Edited coffee');assert.ok(!result.some(v=>v.slug===ventures[1].slug));assert.ok(result.some(v=>v.slug===created.slug));
  assert.equal(model.parseVenture('{broken','broken'),null);assert.equal(model.parseVenture(JSON.stringify(created),'other-slug'),null);
});
function storeHarness(seed={}){
  const records=new Map(Object.entries(seed));let writes=[];
  const sdk={doc:(_,collection,id)=>`${collection}/${id}`,runTransaction:async(_,action)=>{writes=[];const pending=[];await action({get:async ref=>{assert.equal(pending.length,0,'All reads precede writes');return{exists:()=>records.has(ref),data:()=>records.get(ref)};},set:(ref,value)=>pending.push([ref,value]),delete:ref=>pending.push([ref,null])});writes=pending;for(const [ref,value]of pending)value===null?records.delete(ref):records.set(ref,value);}};
  const {writeVenture}=loader({'firebase/firestore':sdk})('src/lib/venture-store.ts');
  return{write:(input,original=null,reserved=[],remove=false)=>writeVenture({},input,original,reserved,remove),records,writes:()=>writes};
}
test('venture save publishes atomically, drafts hide content, stale revisions preserve data and delete leaves a tombstone',async()=>{
  const h=storeHarness(),v=fixture();let r=await h.write({venture:v,status:'published',revision:0});
  assert.equal(r.revision,1);assert.equal(h.records.get('publicVentures/'+v.slug).content,JSON.stringify(v));
  r=await h.write({...r,status:'draft'},v.slug);assert.deepEqual(h.records.get('publicVentures/'+v.slug),{slug:v.slug,deleted:true});
  await assert.rejects(h.write({...r,revision:1},v.slug),/another tab/);assert.equal(h.writes().length,0);
  await h.write(r,v.slug,[],true);assert.ok(!h.records.has('managedVentures/'+v.slug));assert.equal(h.records.get('publicVentures/'+v.slug).deleted,true);
  const source=storeHarness();await source.write({venture:{...v,slug:''},status:'published',revision:0},v.slug,[],true);assert.deepEqual(source.records.get('publicVentures/'+v.slug),{slug:v.slug,deleted:true});
});
test('rename moves a venture atomically and refuses occupied, deleted or source-reserved slugs',async()=>{
  const h=storeHarness(),v=fixture();const r=await h.write({venture:v,status:'published',revision:0});
  const renamed={...r,venture:{...v,slug:'renamed-venture'}};const saved=await h.write(renamed,v.slug);
  assert.equal(saved.revision,1);assert.ok(!h.records.has('managedVentures/'+v.slug));assert.equal(h.records.get('publicVentures/'+v.slug).deleted,true);assert.equal(h.records.get('publicVentures/renamed-venture').deleted,false);
  await assert.rejects(h.write({...saved,venture:{...v,slug:v.slug}},'renamed-venture'),/reserved/);
  await assert.rejects(h.write({venture:fixture(),status:'published',revision:0},null,[v.slug]),/source venture/);
  const staleSource=storeHarness({['publicVentures/'+v.slug]:{slug:v.slug,deleted:true}});
  await assert.rejects(staleSource.write({venture:v,status:'published',revision:0},v.slug),/another tab/);
});
test('anonymous venture snapshot paginates without cache or credentials and fails on invalid/private responses',async()=>{
  const {fetchPublicVentures}=load('src/lib/public-ventures.ts');let calls=0;
  const result=await fetchPublicVentures('demo-portfolio-admin',async(url,options)=>{calls++;assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');if(calls===1)return Response.json({documents:[{name:'documents/publicVentures/test-venture',fields:{slug:{stringValue:'test-venture'},deleted:{booleanValue:false},content:{stringValue:JSON.stringify(fixture())}}}],nextPageToken:'next'});assert.match(url,/pageToken=next/);return Response.json({documents:[]});});
  assert.equal(result.length,1);assert.equal(calls,2);
  await assert.rejects(fetchPublicVentures('demo-portfolio-admin',async()=>new Response(null,{status:403})),/rules/);
  await assert.rejects(fetchPublicVentures('demo-portfolio-admin',async()=>Response.json({documents:[{name:'documents/publicVentures/bad',fields:{slug:{stringValue:'bad'},deleted:{booleanValue:false},content:{stringValue:'{}'}}}]})),/Invalid/);
});
test('live venture pages server-render edited content and original image paths without waiting for JavaScript',()=>{
  const read=loader({'@/lib/firebase-client':{firebaseConfigured:false},'next/link':{__esModule:true,default:({children,...props})=>React.createElement('a',props,children)},'next/navigation':{usePathname:()=>'/ventures/test-venture/'},'./golden-travel-and-tours/trip-planner':{TripPlanner:()=>null}});
  const {LiveVentureDetail}=read('src/components/live-ventures.tsx');const v={...fixture(),name:'Updated venture name',story:'Updated story'};
  const html=renderToStaticMarkup(React.createElement(LiveVentureDetail,{initial:[v]}));assert.match(html,/<h1>Updated venture name<\/h1>/);assert.match(html,/Updated story/);assert.ok(html.includes(v.hero.src));
});
test('sidebar uses the requested order and permits only known admin destinations',()=>{
  const nav=load('src/lib/admin-navigation.ts');assert.deepEqual(nav.adminLinks.map(v=>v.label),['Overview','Pages','Blog','Works','Ventures','Job Finder','Documentation']);assert.equal(nav.safeAdminDestination('/adminauth/ventures'),'/adminauth/ventures/');
});
test('site-wide refresh reaches page and blog subscribers, preserves unrelated storage and cleans up',()=>{
  const prior=global.window,events=new EventTarget(),writes=[];
  global.window={addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),localStorage:{setItem:(k,v)=>writes.push([k,v]),clear:()=>assert.fail('Never clear authentication')}};
  try{const site=load('src/lib/site-refresh.ts'),blog=load('src/lib/blog-refresh.ts');let pages=0,articles=0;const a=site.subscribeSiteRefresh(()=>pages++),b=blog.subscribeBlogRefresh(()=>articles++);assert.equal(site.requestSiteRefresh(),true);assert.equal(pages,1);assert.equal(articles,1);const event=new Event('storage');Object.assign(event,{key:writes[0][0],newValue:'new'});window.dispatchEvent(event);assert.equal(pages,2);assert.equal(articles,2);a();b();site.requestSiteRefresh();assert.equal(pages,2);assert.equal(articles,2);}finally{global.window=prior;}
});
test('page mount and site-wide refresh explicitly read the server and apply the latest record',async()=>{
  const priorWindow=global.window,priorDocument=global.document,events=new EventTarget(),effects=[],states=[];let index=0,reads=0;
  global.window={addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events),localStorage:{setItem(){}}};global.document={visibilityState:'visible',addEventListener(){},removeEventListener(){}};
  const page=load('src/lib/page-model.ts'),updated={...page.emptyPage(),values:{hero:'Latest content'},revision:1};
  const hooks={...React,useState:v=>{const i=index++;states[i]=v;return[v,next=>states[i]=next];},useEffect:fn=>effects.push(fn)};
  const read=loader({react:hooks,'@/lib/firebase-client':{firebaseConfigured:true,getFirebase:()=>({db:{}})},'firebase/firestore':{doc:()=>({}),getDocFromServer:async()=>{reads++;return{exists:()=>true,data:()=>updated};},onSnapshot:()=>()=>{}},'next/link':{__esModule:true,default:()=>null}});
  let stop;
  try{read('src/components/page-content.tsx').PageContent({id:'home',initial:page.emptyPage(),children:null});stop=effects[0]();await new Promise(setImmediate);assert.equal(reads,1);assert.deepEqual(states[0],updated);read('src/lib/site-refresh.ts').requestSiteRefresh();await new Promise(setImmediate);assert.equal(reads,2);}finally{stop?.();global.window=priorWindow;global.document=priorDocument;}
});
