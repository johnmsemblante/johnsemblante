const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function load(file,mocks={}){
  const exports={};
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',js)(name=>mocks[name]??require(name),exports);return exports;
}
const {officeRooms,readOfficeMode,initialOfficeQuality,officeTilt}=load('src/components/office/rooms.ts');
test('camera tilt clamps pointer input and honors reduced motion',()=>{
  assert.deepEqual(officeTilt(0,0,false),{yaw:0,height:0});
  assert.deepEqual(officeTilt(8,-9,false),{yaw:.045,height:-1.4});
  assert.deepEqual(officeTilt(NaN,Infinity,false),{yaw:0,height:0});
  assert.deepEqual(officeTilt(1,1,true),{yaw:0,height:0});
});
test('home preference validates unsupported values and rendering defaults honor device and visitor constraints',()=>{
  assert.equal(readOfficeMode(null),'interactive');assert.equal(readOfficeMode('classic'),'classic');assert.equal(readOfficeMode('corrupt'),'interactive');
  const capable={width:1440,reducedMotion:false,saveData:false,slowConnection:false,cores:8};
  assert.equal(initialOfficeQuality(capable),'high');
  for(const override of [{width:390},{saveData:true},{reducedMotion:true},{slowConnection:true}])assert.equal(initialOfficeQuality({...capable,...override}),'static');
  assert.equal(initialOfficeQuality({...capable,cores:2}),'low');assert.equal(initialOfficeQuality({...capable,width:1000}),'medium');
});
test('every configured room has a unique identity, reachable HTML destination and finite model coordinates',()=>{
  assert.equal(officeRooms.length,8);assert.equal(new Set(officeRooms.map(r=>r.id)).size,8);
  for(const room of officeRooms){assert.ok(room.target.every(Number.isFinite));assert.ok(room.anchor.every(Number.isFinite));assert.ok(room.preview.every(v=>Number.isFinite(v)&&v>=0&&v<=100));assert.ok(room.href.startsWith('/'));const directory='src/app/(portfolio)'+room.href;assert.ok(fs.existsSync(directory+'page.tsx')||fs.existsSync(directory+'[[...slug]]/page.tsx'),room.href);}
});
test('room content adapts published sources, preserves actual destinations and separates tools from games',()=>{
  const {profile}=load('src/content/profile.ts');const tools=load('src/config/tool-ventures.ts');
  const {buildOfficeContent}=load('src/lib/build-office-content.ts',{
    '@/content/profile':{profile,socialAccounts:[]},'@/content/site':{site:{email:'public@example.test'}},'@/config/tool-ventures':tools,
    '@/content/industries':{industries:[{slug:'other',label:'Other Industries'}],industryPath:slug=>`/work/industry/${slug}/`},
  });
  const content=buildOfficeContent([{slug:'published-work',title:'Published work',summary:'Real summary',image:{src:'/test.webp'},technologies:['CSS'],industries:['other']}],[{slug:'real-venture',name:'Real venture',description:'Real description',category:'Venture'}],[{slug:'actual-article',title:'Actual article',excerpt:'Published excerpt',category:'Notes'}]);
  assert.deepEqual(Object.keys(content).sort(),officeRooms.map(r=>r.id).sort());
  assert.equal(content.work.cards[0].href,'/work/published-work/');assert.equal(content.work.cards[0].image,'/test.webp');
  assert.equal(content.ventures.cards[0].href,'/ventures/real-venture/');assert.equal(content.blog.cards[0].href,'/blog/actual-article/');
  assert.equal(content.tools.cards.length,4);assert.ok(content.tools.cards.every(c=>c.href.startsWith('/tools/')));
  assert.equal(content.arcade.cards.length,1);assert.equal(content.arcade.cards[0].href,'/games/neon-dash/');
  assert.equal(content.about.description,profile.introduction);
});
