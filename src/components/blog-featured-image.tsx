"use client";

import { useState } from "react";
import { safeAssetUrl } from "@/lib/blog-model";

export function BlogFeaturedImage({ src = "", alt = "" }: { src?: string; alt?: string }) {
  const [failed, setFailed] = useState("");
  const image = src.trim();
  const fallback = !image || !safeAssetUrl(image) || failed === image;
  return <div className={`blog-featured-image${fallback ? " is-fallback" : ""}`}>
    {fallback ? <span className="blog-logo" role="img" aria-label="John Semblante logo">js<span>.</span></span> : <img src={image} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(image)} />}
  </div>;
}
