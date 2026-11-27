import { preload } from "react-dom";

const portraitSources = "/images/profile/john-doodle-sketch-400.avif 400w, /images/profile/john-doodle-sketch-640.avif 640w";
const portraitSizes = "(max-width: 760px) min(94vw, 460px), (max-width: 1440px) 43vw, 640px";

export function HeroPortrait() {
  preload("/images/profile/john-doodle-sketch-640.avif", {
    as: "image", type: "image/avif", imageSrcSet: portraitSources, imageSizes: portraitSizes, fetchPriority: "high",
  });
  return <figure className="hero-portrait">
    <picture className="hero-portrait-art">
      <source type="image/avif" srcSet={portraitSources} sizes={portraitSizes} />
      <img src="/images/profile/john-doodle-sketch.webp" alt="Graphite portrait of John Clark Semblante" width={640} height={827} fetchPriority="high" decoding="async" />
    </picture>
  </figure>;
}
