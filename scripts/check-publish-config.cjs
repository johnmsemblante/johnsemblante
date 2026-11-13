const required = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_MEDIA_UPLOAD_URL', 'NEXT_PUBLIC_HIMALAYAS_PROXY_URL'];

function validatePublishConfig(env) {
  const errors = [];
  for (const name of required) {
    const value = env[name];
    if (typeof value !== 'string' || !value.trim()) { errors.push(`${name}: missing value`); continue; }
    if (value !== value.trim() || /^['"]|['"]$/.test(value) || /^[A-Z][A-Z0-9_]*=/.test(value)) {
      errors.push(`${name}: enter only the value, without NAME=, quotes or surrounding whitespace`); continue;
    }
    let valid = true;
    if (name.endsWith('_API_KEY')) valid = /^AIza[\w-]{35}$/.test(value);
    else if (name.endsWith('_PROJECT_ID')) valid = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value);
    else if (name.endsWith('_APP_ID')) valid = /^1:\d+:web:[a-f0-9]+$/i.test(value);
    else if (name.endsWith('_AUTH_DOMAIN')) valid = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(value);
    else {
      try { const url = new URL(value); valid = url.protocol === 'https:' && !url.username && !url.password && !url.hash; }
      catch { valid = false; }
    }
    if (!valid) errors.push(`${name}: invalid format; use the existing configured public value`);
  }
  return errors;
}

async function verifyFirebaseSignIn(env, fetcher = fetch) {
  // This is the same public project-config request the Firebase browser SDK uses.
  // Do not log URLs, configuration values or provider response bodies.
  const response = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(env.NEXT_PUBLIC_FIREBASE_API_KEY)}`, {
    headers: { Referer: 'https://johnsemblante.com/' }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error(`Firebase sign-in preflight failed (HTTP ${response.status}). Check the existing public API key and API restrictions.`);
  const config = await response.json();
  if (!Array.isArray(config.authorizedDomains) || !config.authorizedDomains.includes('johnsemblante.com')) throw Error('Firebase sign-in preflight failed: the production domain is not authorized.');
}

if (require.main === module) {
  (async () => {
    const errors = validatePublishConfig(process.env);
    if (errors.length) throw Error(`Invalid publishing configuration:\n${errors.join('\n')}`);
    await verifyFirebaseSignIn(process.env);
    console.log('Public build configuration and Firebase sign-in preflight passed.');
  })().catch(error => {
    console.error(error.name === 'TimeoutError' || error.message === 'fetch failed' ? 'Firebase sign-in preflight could not connect. Retry before deploying.' : error.message);
    process.exitCode = 1;
  });
}
module.exports = { validatePublishConfig, verifyFirebaseSignIn };
