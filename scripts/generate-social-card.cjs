const fs = require('node:fs');
const ts = require('typescript');
const sharp = require('sharp');
const exported = {};
const code = ts.transpileModule(fs.readFileSync('src/content/profile.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
new Function('exports', code)(exported);
const escape = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
const { fullName, title } = exported.profile;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f6f5ef"/><rect x="38" y="38" width="1124" height="554" rx="8" fill="#edf1e8" stroke="#cbd4c7"/>
<path d="M860 38h302v554H860z" fill="#e0e8d8"/><circle cx="1006" cy="315" r="114" fill="#f6f5ef" stroke="#b5c6ac"/>
<text x="926" y="354" font-family="Arial,sans-serif" font-weight="700" font-size="130" letter-spacing="-15" fill="#252b25">js<tspan fill="#32766c">.</tspan></text>
<text x="90" y="150" font-family="Arial,sans-serif" font-size="20" letter-spacing="4" fill="#32766c">PORTFOLIO &amp; VENTURES</text>
<text x="86" y="265" font-family="Arial,sans-serif" font-size="58" font-weight="700" letter-spacing="-2" fill="#252b25">${escape(fullName)}</text>
<text x="90" y="345" font-family="Arial,sans-serif" font-size="34" fill="#252b25">${escape(title)}</text>
<text x="90" y="398" font-family="Arial,sans-serif" font-size="27" fill="#62695b">Websites, practical fixes, and ideas.</text>
<path d="M90 460h695" stroke="#c0cdbb"/><text x="90" y="516" font-family="Arial,sans-serif" font-size="23" fill="#62695b">Cebu, Philippines</text></svg>`;
fs.mkdirSync('public/images/seo', { recursive: true });
sharp(Buffer.from(svg)).png().toFile('public/images/seo/john-semblante-social.png').then(() => console.log('Updated the 1200×630 social card from the current profile name and title.')).catch(error => { console.error(error.message); process.exitCode = 1; });
