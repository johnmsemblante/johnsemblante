import type { Metadata } from "next";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { site } from "@/content/site";
import { profile } from "@/content/profile";

type ImageDetails = { alt?: string; width?: number; height?: number };
type ImageCandidate = ImageDetails & ({ url: string } | { src: string });
type SocialImage = ImageDetails & { url: string; alt: string; type?: string };
const manifestPath = join(process.cwd(), ".generated", "social-images.json");
const staticCards: Record<string, Omit<SocialImage, "alt">> | undefined =
  process.env.NODE_ENV === "production" && existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : undefined;

export function selectSocialImage(title: string, ...candidates: (ImageCandidate | undefined)[]): SocialImage | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = ("src" in candidate ? candidate.src : candidate.url).trim();
    if (!/^\/(?!\/)[^\s\\]*$/.test(value) && !/^https:\/\/[^\s\\]+$/i.test(value)) continue;
    try {
      const url = new URL(value, site.url);
      if (url.username || url.password) continue;
      const alt = candidate.alt?.trim() || title;
      if (url.origin === new URL(site.url).origin) {
        const path = decodeURIComponent(url.pathname);
        if (path.includes("\\") || path.split("/").some(segment => segment === ".." || segment === ".")) continue;
        const card = staticCards?.[path];
        if (card) return { ...card, url: new URL(card.url, site.url).href, alt };
        if (!/\.(?:jpe?g|png|gif|webp|avif)$/i.test(path) || !existsSync(join("public", path))) continue;
      }
      return { url: url.href, width: candidate.width, height: candidate.height, alt };
    } catch {
      // Try the next configured image when the URL cannot be used.
    }
  }
}

export function pageMetadata(title: string, description: string, path: string, ...images: (ImageCandidate | undefined)[]): Metadata {
  const socialImage = selectSocialImage(title, ...images) ?? { url: new URL(site.socialImage, site.url).href, width: 1200, height: 630, type: "image/png", alt: `${profile.fullName}, ${profile.title} in Cebu, Philippines` };
  return { title, description, alternates: { canonical: `${site.url}${path}` },
    openGraph: { title, description, url: `${site.url}${path}`, siteName: site.searchName, locale: "en_PH", type: "website", images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: socialImage.url, alt: socialImage.alt }] } };
}
