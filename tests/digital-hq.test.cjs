const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,mocks={}){
  const exports={};
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',js)(name=>mocks[name]??require(name),exports);return exports;
}
const {hqObjects,readMode,initialQuality}=load('src/components/digital-hq/objects.ts');
test('home preference validates unsupported values and rendering defaults honor device and visitor constraints',()=>{
  assert.equal(readMode(null),'interactive');assert.equal(readMode('classic'),'classic');assert.equal(readMode('corrupt'),'interactive');
  const capable={width:1440,reducedMotion:false,saveData:false,slowConnection:false,cores:8};
  assert.equal(initialQuality(capable),'high');
  for(const override of [{width:390},{saveData:true},{reducedMotion:true},{slowConnection:true}])assert.equal(initialQuality({...capable,...override}),'low');
  assert.equal(initialQuality({...capable,cores:2}),'low');assert.equal(initialQuality({...capable,width:1000}),'medium');
});
test('every configured room has a unique identity, reachable HTML destination and finite model coordinates',()=>{
  assert.equal(hqObjects.length,8);assert.equal(new Set(hqObjects.map(r=>r.id)).size,8);
  for(const room of hqObjects){assert.ok(room.position.every(Number.isFinite) && room.camera.position.every(Number.isFinite) && room.camera.target.every(Number.isFinite));assert.ok(room.anchor.every(Number.isFinite));assert.ok(room.preview.every(v=>Number.isFinite(v)&&v>=0&&v<=100));assert.ok(room.href.startsWith('/'));const directory='src/app/(portfolio)'+room.href;assert.ok(fs.existsSync(directory+'page.tsx')||fs.existsSync(directory+'[[...slug]]/page.tsx'),room.href);}
});
test('room content adapts published sources, preserves actual destinations and separates tools from games',()=>{
  const {profile}=load('src/content/profile.ts');const tools=load('src/config/tool-ventures.ts');
  const {buildHQContent}=load('src/lib/build-hq-content.ts',{
    '@/content/profile':{profile,socialAccounts:[]},'@/content/site':{site:{email:'public@example.test'}},'@/config/tool-ventures':tools,
    '@/content/industries':{industries:[{slug:'other',label:'Other Industries'}],industryPath:slug=>`/work/industry/${slug}/`},
  });
  const content=buildHQContent([{slug:'published-work',title:'Published work',summary:'Real summary',image:{src:'/test.webp'},technologies:['CSS'],industries:['other']}],[{slug:'real-venture',name:'Real venture',description:'Real description',category:'Venture'}],[{slug:'actual-article',title:'Actual article',excerpt:'Published excerpt',category:'Notes'}]);
  assert.deepEqual(Object.keys(content).sort(),hqObjects.map(r=>r.id).sort());
  assert.equal(content.work.cards[0].href,'/work/published-work/');assert.equal(content.work.cards[0].image,'/test.webp');
  assert.equal(content.ventures.cards[0].href,'/ventures/real-venture/');assert.equal(content.blog.cards[0].href,'/blog/actual-article/');
  assert.equal(content.tools.cards.length,4);assert.ok(content.tools.cards.every(c=>c.href.startsWith('/tools/')));
  assert.equal(content.arcade.cards.length,1);assert.equal(content.arcade.cards[0].href,'/games/neon-dash/');
  assert.equal(content.about.description,profile.introduction);
});
