import type { Metadata } from "next";
import { site } from "@/content/site";
export function pageMetadata(title: string, description: string, path: string, image?: { url: string; alt: string; width?: number; height?: number }): Metadata {
  const socialImage = image ?? { url: site.socialImage, width: 1200, height: 630, alt: "John Semblante — WordPress and front-end developer in Cebu, Philippines" };
  return { title, description, alternates: { canonical: `${site.url}${path}` },
    openGraph: { title, description, url: `${site.url}${path}`, siteName: site.name, locale: "en_PH", type: "website", images: [socialImage] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: socialImage.url, alt: socialImage.alt }] } };
}
