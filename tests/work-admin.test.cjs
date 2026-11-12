const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
function load(file,deps={}){const out={};new Function('require','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>deps[name]??require(name),out);return out;}
const industry=load('src/content/industries.ts'),model=load('src/lib/work-model.ts',{'@/content/industries':industry}),reader=load('src/lib/public-works.ts',{'./work-model':model});
const project=()=>({...model.emptyWork(),slug:'sample',title:'Sample',summary:'Introduction',role:'Developer',technologies:['WordPress'],publication:'published'});
const uploadEnvironment={FIREBASE_PROJECT_ID:'demo-portfolio-admin',CLOUDINARY_CLOUD_NAME:'test',CLOUDINARY_API_KEY:'public-test-key',CLOUDINARY_API_SECRET:'test-secret-only',CLOUDINARY_UPLOAD_PRESET:'portfolio_works',ALLOWED_ORIGINS:'https://portfolio.test'};
function uploadRequest(bytes=10,type='image/png'){const claims=Buffer.from(JSON.stringify({aud:'demo-portfolio-admin',iss:'https://securetoken.google.com/demo-portfolio-admin',email_verified:true,sub:'owner'})).toString('base64url');const form=new FormData();form.set('file',new File([new Uint8Array(bytes)],'image.png',{type}));return new Request('https://worker.test/upload',{method:'POST',headers:{Origin:'https://portfolio.test',Authorization:`Bearer x.${claims}.test`},body:form});}

test('Upload requests use Workers-compatible redirect handling and reject redirected authorization or uploads',async()=>{
  const worker=load('workers/media-upload/index.ts').default,old=global.fetch;
  try {
    for(const redirectAt of ['none','firestore','cloudinary']) {
      const calls=[];
      global.fetch=async(url,options)=>{
        // Node accepts redirect:error; Cloudflare Workers throws before sending it.
        assert.equal(options.redirect,'manual');
        const provider=url.includes('firestore.googleapis.com')?'firestore':'cloudinary';
        calls.push(provider);
        if(provider===redirectAt)return new Response(null,{status:302,headers:{Location:'https://untrusted.invalid/'}});
        return Response.json(provider==='firestore'?{fields:{enabled:{booleanValue:true}}}:{secure_url:'https://res.cloudinary.com/test/image/upload/image.png',resource_type:'image',format:'png'});
      };
      const response=await worker.fetch(uploadRequest(),uploadEnvironment);
      assert.equal(response.status,redirectAt==='none'?200:redirectAt==='firestore'?403:502);
      assert.deepEqual(calls,redirectAt==='firestore'?['firestore']:['firestore','cloudinary']);
    }
  } finally {global.fetch=old;}
});
test('Approved image uploads are signed on the server and return only an image URL',async()=>{const worker=load('workers/media-upload/index.ts').default,old=global.fetch;let calls=0;global.fetch=async(url,options)=>{calls++;if(calls===1)return Response.json({fields:{enabled:{booleanValue:true}}});assert.equal(url,'https://api.cloudinary.com/v1_1/test/image/upload');const form=options.body;assert.equal(form.get('upload_preset'),'portfolio_works');assert.equal(form.get('allowed_formats'),'jpg,jpeg,png,webp,avif');assert.equal(form.get('overwrite'),'false');const params=[...form.entries()].filter(([k])=>!['file','api_key','signature'].includes(k)).sort(([a],[b])=>a.localeCompare(b));const expected=require('crypto').createHash('sha256').update(params.map(([k,v])=>`${k}=${v}`).join('&')+uploadEnvironment.CLOUDINARY_API_SECRET).digest('hex');assert.equal(form.get('signature'),expected);return Response.json({secure_url:'https://res.cloudinary.com/test/image/upload/image.png',resource_type:'image',format:'png'});};try{const response=await worker.fetch(uploadRequest(),uploadEnvironment);assert.equal(response.status,200);assert.deepEqual(await response.json(),{url:'https://res.cloudinary.com/test/image/upload/image.png'});assert.equal(calls,2);}finally{global.fetch=old;}});
test('Upload service enforces file size/type before Cloudinary and preserves provider error privacy',async()=>{const worker=load('workers/media-upload/index.ts').default,old=global.fetch;let calls=0;global.fetch=async()=>{calls++;return Response.json({fields:{enabled:{booleanValue:true}}});};try{assert.equal((await worker.fetch(uploadRequest(5*1024*1024+1),uploadEnvironment)).status,400);assert.equal((await worker.fetch(uploadRequest(10,'text/html'),uploadEnvironment)).status,400);assert.equal(calls,2);global.fetch=async url=>url.includes('firestore')?Response.json({fields:{enabled:{booleanValue:true}}}):Response.json({error:{message:'PRIVATE_PROVIDER_DETAILS'}},{status:401});const response=await worker.fetch(uploadRequest(),uploadEnvironment);assert.equal(response.status,502);assert.ok(!(await response.text()).includes('PRIVATE_PROVIDER_DETAILS'));}finally{global.fetch=old;}});
test('Cloudinary failures identify configuration problems without exposing provider details', async () => {
  const worker = load('workers/media-upload/index.ts').default;
  const previousFetch = global.fetch;
  const failures = [
    ['Unknown API key PRIVATE_PROVIDER_DETAILS', /configured API key/],
    ['Invalid Signature PRIVATE_PROVIDER_DETAILS', /upload signature/],
    ['Upload preset PRIVATE_PROVIDER_DETAILS not found', /upload preset/],
    ['File size too large PRIVATE_PROVIDER_DETAILS', /image size/],
    ['Unsupported file format PRIVATE_PROVIDER_DETAILS', /image format/],
    ['Credit quota exceeded PRIVATE_PROVIDER_DETAILS', /upload allowance/],
    ['Unrecognized PRIVATE_PROVIDER_DETAILS', /Cloudinary rejected the image/],
  ];
  try {
    for (const [message, expected] of failures) {
      global.fetch = async url => url.includes('firestore.googleapis.com')
        ? Response.json({ fields: { enabled: { booleanValue: true } } })
        : Response.json({ error: { message } }, { status: 400 });
      const response = await worker.fetch(uploadRequest(), uploadEnvironment);
      assert.equal(response.status, 502);
      const result = await response.json();
      assert.match(result.message, expected);
      assert.ok(!result.message.includes('PRIVATE_PROVIDER_DETAILS'));
    }
  } finally {
    global.fetch = previousFetch;
  }
});

test('Work transactions publish matching data and reject concurrent edits without writes',async()=>{let current=null;let writes=[];const store=load('src/lib/work-store.ts',{'./work-model':model,'firebase/firestore':{doc:(_db,...parts)=>parts.join('/'),serverTimestamp:()=>123,runTransaction:async(_db,callback)=>callback({get:async()=>({exists:()=>current!==null,data:()=>current}),set:(...args)=>writes.push(['set',...args]),delete:(...args)=>writes.push(['delete',...args])})}});const saved=await store.writeWork({},project(),null);assert.equal(saved.revision,1);assert.equal(writes[0][1],'managedWorks/sample');assert.equal(writes[1][2].project.title,'Sample');current={revision:2};writes=[];await assert.rejects(()=>store.writeWork({},project(),1),/changed in another tab/);assert.equal(writes.length,0);});
test('Works overrides keep original entries, replace saved records and honor draft/delete tombstones',()=>{const source=[project(),{...project(),slug:'second'}];assert.deepEqual(model.mergeWorks(source,[]),source);assert.equal(model.mergeWorks(source,[{slug:'sample',deleted:false,project:{...project(),title:'Updated'}}])[0].title,'Updated');assert.deepEqual(model.mergeWorks(source,[{slug:'sample',deleted:true}]).map(p=>p.slug),['second']);assert.equal(model.mergeWorks(source,[{slug:'sample',deleted:false,project:{...project(),publication:'draft'}}]).length,1);});
test('Works validation covers unsafe URLs, label limits, required content and stable generated slugs',()=>{assert.equal(model.validateWork(project()),'');for(const p of [{...project(),website:'javascript:alert(1)'},{...project(),image:{src:'//evil.test/image',alt:'Image'}},{...project(),technologies:[]},{...project(),industries:['invented']},{...project(),year:2},{...project(),tags:['a'.repeat(81)]}])assert.ok(model.validateWork(p));assert.equal(model.workSlug('My Next.js Project!'),'my-next-js-project');});
test('Public Works reader is anonymous, paginated and fails rather than silently discarding overrides',async()=>{let calls=0;const records=await reader.fetchPublicWorks('demo-portfolio-admin',async(url,options)=>{assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.ok(!options.headers);calls++;return new Response(JSON.stringify(calls===1?{documents:[{name:'projects/test/documents/publicWorks/sample',fields:{slug:{stringValue:'sample'},deleted:{booleanValue:true}}}],nextPageToken:'next'}:{}),{status:200});});assert.equal(calls,2);assert.deepEqual(records,[{slug:'sample',deleted:true}]);await assert.rejects(()=>reader.fetchPublicWorks('demo-portfolio-admin',async()=>new Response('',{status:403})));});
test('Upload service rejects unauthenticated, forged and revoked accounts before handling files',async()=>{const worker=load('workers/media-upload/index.ts').default;const env={FIREBASE_PROJECT_ID:'demo-portfolio-admin',CLOUDINARY_CLOUD_NAME:'test',CLOUDINARY_API_KEY:'public',CLOUDINARY_API_SECRET:'test-only',CLOUDINARY_UPLOAD_PRESET:'portfolio_works',ALLOWED_ORIGINS:'https://portfolio.test'};const old=global.fetch;let count=0;global.fetch=async()=>{count++;return new Response('{}',{status:403});};try{assert.equal((await worker.fetch(new Request('https://worker.test/upload',{method:'POST',headers:{Origin:'https://evil.test'}}),env)).status,403);assert.equal((await worker.fetch(new Request('https://worker.test/upload',{method:'POST',headers:{Origin:'https://portfolio.test'}}),env)).status,401);const claims=Buffer.from(JSON.stringify({aud:'demo-portfolio-admin',iss:'https://securetoken.google.com/demo-portfolio-admin',email_verified:true,sub:'owner'})).toString('base64url');const response=await worker.fetch(new Request('https://worker.test/upload',{method:'POST',headers:{Origin:'https://portfolio.test',Authorization:`Bearer x.${claims}.forged`}}),env);assert.equal(response.status,403);assert.equal(count,1);assert.ok(!(await response.text()).includes('signature'));}finally{global.fetch=old;}});
