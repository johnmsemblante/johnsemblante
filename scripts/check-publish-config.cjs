const required = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'NEXT_PUBLIC_MEDIA_UPLOAD_URL', 'NEXT_PUBLIC_HIMALAYAS_PROXY_URL'];
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length) { console.error(`Missing GitHub Actions variables: ${missing.join(', ')}`); process.exitCode = 1; }
