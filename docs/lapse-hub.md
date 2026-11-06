# Lapse Hub photography venture

Lapse Hub is registered at `/ventures/lapse-hub/` and appears with Lazy Barista and Golden Travel and Tours on the Ventures page and homepage. Its story is based on John's description: a photography hobby that grew into commissioned photography. This revision does not invent booking availability, prices, a founding date, awards or a current photography service package.

## Photo hosting and space

The main site is a Next.js static export on **Firebase Hosting**. The existing Cloudflare Worker is for the Job Finder feed. Lapse Hub's photographs load directly from **Flickr's image CDN** using normal image elements; they are not stored in `public/`, included as image binaries in `out/`, or proxied through either hosting service. HTML, CSS, JavaScript and photo-link metadata still add a small amount to the deployment. Flickr remains responsible for image availability and delivery.

The gallery contains **12 curated public album-cover photographs**, selected from the public albums at https://www.flickr.com/photos/johnmsemblante/albums/ and checked on 6 November 2026. It is a selection, not an import of every photograph or a live sync. Each album link opens the rest of that shoot on Flickr. The Facebook page at https://www.facebook.com/lapsehub is linked as Lapse Hub's public photography page; Facebook images are not used as gallery files.

No Flickr API key, paid gallery service, account login, new runtime dependency or paid hosting upgrade is required. The browser loads third-party image URLs. New uploads do not appear automatically: edit the curated list and rebuild/deploy. Deleting images or changing their availability on Flickr can break the external images; captions/source album links remain available and failed previews show a fallback.

## Editing the gallery and story

Edit `src/ventures/lapse-hub/content.ts`:

- `lapseHub` contains the venture name, story, description, hero and social links.
- `lapseHubGallery` contains the selected images. Each item has a title, full preview URL, smaller thumbnail URL, alt text, full-image dimensions, caption/credit and the source Flickr album URL.
- The normal gallery uses smaller thumbnails. The popup loads the selected larger image when opened, with previous/next controls, keyboard navigation, source attribution and focus restoration.
- The hero uses its larger Flickr image. The venture card, single-page header and hero branding use the same yellow Lapse Hub media profile picture retrieved from the public Facebook page. The unchanged 720?720 JPEG is stored at `public/ventures/lapse-hub/logo.jpg` (about 11 KB) for reliable logo loading. Gallery photographs remain external.

Keep selected photos public and use your own work or appropriately authorized work. Use Flickr's Share/embed tools or its documented image URL formats to obtain URLs; do not paste private Guest Pass links, login cookies or API credentials. Preserve a visible link back to Flickr for every displayed photograph, including in the popup. The source album titles are preserved; alt text should describe the visible image accurately without inventing details.

The shared popup changes live in `src/components/zoom-image.tsx`; existing local-image galleries still work without Flickr fields. The photography-specific layout is `src/ventures/photography-landing.tsx`. It avoids the coffee/travel offering forms. The venture registry automatically includes the new page in route generation and the sitemap. Venture social metadata now accepts both local assets and external image URLs correctly.

## Validation and deployment

Run:

```powershell
npm run test:ventures
npm run test:work
npm run typecheck
npm run build
npm run audit:seo
```

Tests cover the third venture registration, the original ventures, externally hosted gallery URLs/source links, rendered gallery content and absolute social-image metadata. The popup was also checked in a rendered React DOM for thumbnail/full-size selection, next-photo navigation, source links, unavailable images, close behavior and focus restoration. External image URLs were checked separately; their continued availability depends on Flickr.

Deploy the normal Hosting export when ready. No Firestore, Auth, Storage or Cloudflare Worker configuration change is needed for this venture.

References: [Flickr sharing and backlink requirements](https://www.flickrhelp.com/hc/en-us/articles/4404078014356-Share-your-Flickr-content), [Flickr image URL formats](https://www.flickr.com/services/api/misc.urls.html).
