# Installable portfolio

Next.js links `src/app/manifest.webmanifest` from the page metadata and includes it in the static export. It declares a stable root identity and start URL, same-origin root scope, standalone display and two PNG launcher icons in `public/`. Safari can also use the existing `src/app/apple-icon.png`. There is no service worker, offline cache, push subscription or change to admin authentication.

When refreshing branding, update both PNG launcher sizes (192×192 and 512×512) and review the Apple touch icon. Keep the manifest identity stable so browsers can recognize existing installations.

After a production build, verify that the homepage links the manifest and that the exported manifest and PNGs exist. After Hosting deploys, check that the linked manifest and both icons return HTTP 200 over HTTPS with manifest and image content types. Test installation from Safari on iPhone and Chrome on Android, then launch from the home screen and confirm that the homepage opens without the normal browser toolbar.
