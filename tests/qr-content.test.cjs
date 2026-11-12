const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
const output={};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/qr-content.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(output);
const {qrContent,emptyQrFields,qrContrast,qrByteString}=output;
const content=(type,fields)=>qrContent(type,{...emptyQrFields,...fields});
test('URLs allow only complete HTTP(S) destinations without embedded credentials',()=>{
  assert.equal(content('url',{url:'https://example.com/a?q=hello world&n=2'}).data,'https://example.com/a?q=hello%20world&n=2');
  for(const url of ['example.com','javascript:alert(1)','ftp://example.com','https://a:b@example.com','https://'])assert.ok(content('url',{url}).error);
});
test('text preserves Unicode and special characters; capacity counts UTF-8 bytes',()=>{
  assert.deepEqual([...qrByteString('日本語 😀')].map(c=>c.charCodeAt(0)),[...new TextEncoder().encode('日本語 😀')]);
  assert.equal(content('text',{text:'Hello 日本語 <script> & 😀'}).data,'Hello 日本語 <script> & 😀');
  assert.ok(content('text',{text:'😀'.repeat(401)}).error);
  assert.equal(content('text',{text:'a'.repeat(1600)}).error,'');
  assert.ok(content('text',{text:'a'.repeat(1601)}).error);
});
test('Wi-Fi escapes delimiters and omits passwords for open networks',()=>{
  assert.equal(content('wifi',{ssid:'a;b,c:d"e\\f',password:'p;ass',hidden:true}).data,'WIFI:T:WPA;S:a\\;b\\,c\\:d\\"e\\\\f;P:p\\;ass;H:true;;');
  assert.equal(content('wifi',{ssid:'Guest',security:'nopass',password:'secret'}).data,'WIFI:T:nopass;S:Guest;H:false;;');
  assert.ok(content('wifi',{ssid:'Private'}).error);
  assert.ok(content('wifi',{ssid:'Legacy',security:'WEP',password:'abcde'}).data.includes('T:WEP;'));
});
test('email encodes query content and international phone formatting is accepted',()=>{
  assert.equal(content('email',{email:'hello+qr@example.com',subject:'A & B?',message:'Line 1\nLine 2'}).data,'mailto:hello%2Bqr@example.com?subject=A%20%26%20B%3F&body=Line%201%0ALine%202');
  assert.ok(content('email',{email:'a@b?subject=bad'}).error);
  assert.equal(content('phone',{phone:'+63 (912) 345-6789'}).data,'tel:+639123456789');
  for(const phone of ['abc','+12','1234567890123456','++639123456789'])assert.ok(content('phone',{phone}).error);
});
test('empty content never produces a QR and contrast detects light-on-dark',()=>{
  for(const type of ['url','text','wifi','email','phone'])assert.deepEqual(content(type,{}),{data:'',error:''});
  assert.equal(qrContrast('#000000','#ffffff').ratio,21);
  assert.equal(qrContrast('#ffffff','#000000').inverted,true);
  assert.equal(qrContrast('#ffffff','#ffffff').ratio,1);
});
test('tools stay outside admin and database registries, using their own card links',()=>{
  for(const file of ['src/ventures/registry.ts','src/lib/venture-store.ts','src/components/admin/admin-ventures.tsx','src/lib/page-catalog.ts'])assert.ok(!fs.readFileSync(file,'utf8').includes('tool-ventures'),file);
  assert.ok(fs.readFileSync('src/app/(portfolio)/ventures/page.tsx','utf8').includes('<ToolVentureCards />'));
  const cards=fs.readFileSync('src/components/tool-venture-cards.tsx','utf8');assert.ok(cards.includes('href={tool.route}'));assert.ok(!cards.includes('<PageLink'));
  for(const file of ['src/components/qr-generator.tsx','src/lib/qr-content.ts'])assert.ok(!/localStorage|sessionStorage|console\.|fetch\(|firebase|cloudinary/i.test(fs.readFileSync(file,'utf8')),file);
});
