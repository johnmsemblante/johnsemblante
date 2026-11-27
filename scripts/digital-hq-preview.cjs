// Explicit preview-channel workflow. Never calls Firebase's live deploy command.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const BRANCH = 'feature/digital-hq-interactive-portfolio';
const PROJECT = 'johnmsemblanteapp';
const CHANNEL = 'digital-hq';
const root = path.resolve(__dirname, '..');
const receiptPath = path.join(root, 'tmp/digital-hq-preview/latest-build.json');

function assertSource(branch, commit, receiptCommit) {
  if (branch !== BRANCH) throw new Error(`Preview requires ${BRANCH}; current branch is ${branch}.`);
  if (receiptCommit && commit !== receiptCommit) throw new Error('Source changed since the preview build. Build again.');
}

function previewConfig(base, publicDirectory) {
  if (base.hosting.site !== PROJECT) throw new Error('Unexpected Firebase Hosting site.');
  const hosting = structuredClone(base.hosting);
  hosting.public = publicDirectory;
  hosting.headers = [...(hosting.headers || []), {
    source: '**', headers: [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Cache-Control', value: 'no-store' },
    ],
  }];
  return { hosting };
}

function deployArgs(configPath) {
  return ['hosting:channel:deploy', CHANNEL, '--project', PROJECT, '--config', configPath,
    '--expires', '30d', '--no-authorized-domains', '--non-interactive', '--json'];
}

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function runNode(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Command failed (${result.status}): node ${args.join(' ')}`);
}

function main() {
  const action = process.argv[2];
  if (!['build', 'deploy'].includes(action)) throw new Error('Use build or deploy [--firebase-cli path/to/firebase.js].');
  const branch = git('branch', '--show-current');
  const sourceCommit = git('rev-parse', 'HEAD');
  assertSource(branch, sourceCommit);
  if (git('status', '--porcelain')) throw new Error('Commit reviewed changes before building or deploying the preview.');

  if (action === 'build') {
    // Invalidate the old receipt before building, so a failed build cannot deploy an older export.
    if (fs.existsSync(receiptPath)) fs.unlinkSync(receiptPath);
    runNode(['scripts/prepare-pdf-assets.cjs']);
    runNode(['scripts/prepare-social-images.cjs']);
    runNode(['node_modules/next/dist/bin/next', 'build', '--webpack'], {
      ...process.env, NEXT_PUBLIC_DIGITAL_HQ_PREVIEW: 'true',
    });
    const parent = path.dirname(receiptPath);
    fs.mkdirSync(parent, { recursive: true });
    const directory = fs.mkdtempSync(path.join(parent, 'build-'));
    const publicDirectory = path.join(directory, 'public');
    fs.cpSync(path.join(root, 'out'), publicDirectory, { recursive: true });
    const oldReceipt = path.join(publicDirectory, 'content-deployment.json');
    if (fs.existsSync(oldReceipt)) fs.unlinkSync(oldReceipt);
    const manifest = { branch, sourceCommit, builtAt: new Date().toISOString(), preview: true, temporaryCharacter: true };
    fs.writeFileSync(path.join(publicDirectory, 'digital-hq-preview.json'), JSON.stringify(manifest, null, 2) + '\n');
    const configPath = path.join(directory, 'firebase.preview.json');
    const config = previewConfig(JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8')), publicDirectory);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    fs.writeFileSync(receiptPath, JSON.stringify({ ...manifest, configPath, publicDirectory }, null, 2) + '\n');
    console.log(`Preview build ready: ${sourceCommit}. Only the ${CHANNEL} channel may receive this export.`);
  } else {
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    assertSource(branch, sourceCommit, receipt.sourceCommit);
    const option = process.argv.indexOf('--firebase-cli');
    const cli = option >= 0 ? process.argv[option + 1] : path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js');
    if (!cli || !fs.existsSync(cli)) throw new Error('Supply --firebase-cli with an installed Firebase CLI JavaScript entry point.');
    runNode([cli, ...deployArgs(receipt.configPath)]);
  }
}

module.exports = { assertSource, previewConfig, deployArgs, BRANCH };
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
