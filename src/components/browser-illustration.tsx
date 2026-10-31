type Portrait = { src: string; name: string };
type Showcase = {
  kind: "work" | "ventures"; label: string; caption: string;
  images: { src: string; name: string; width: number; height: number }[];
};

/** A layout illustration; the homepage variant introduces the site's owner. */
export function BrowserIllustration({ portrait, showcase }: { portrait?: Portrait; showcase?: Showcase }) {
  const description = portrait
    ? `${portrait.name}, the developer behind this website, pictured inside a responsive website illustration`
    : showcase ? `${showcase.images.map(image => image.name).join(" and ")} shown inside a responsive website illustration` : undefined;
  return <div className={`browser-study${portrait ? " personal-study" : ""}${showcase ? ` showcase-study showcase-${showcase.kind}` : ""}`} role={description ? "img" : undefined} aria-label={description} aria-hidden={description ? undefined : true}>
    <div className="study-window">
      <div className="study-toolbar"><i /><i /><i /><span /></div>
      <div className="study-content">
        <div className="study-sidebar"><b>js.</b><i /><i /><i /></div>
        <div className="study-canvas">
          <div className="study-label">{portrait ? "THE PERSON BEHIND THE PIXELS" : showcase?.label ?? "IDEA → EXPERIENCE"}</div>
          {portrait ? <div className="study-introduction">
            <div className="study-person-copy"><span>Hello, I’m</span><strong>{portrait.name}</strong><span className="study-person-role">Full Stack Developer</span><div className="study-button" /></div>
            <div className="study-portrait-frame"><img src={portrait.src} alt="" width={1103} height={1426} /></div>
          </div> : showcase ? <div className="study-showcase">{showcase.images.map(asset => <div className="study-showcase-card" key={asset.src}><div className="study-showcase-image"><img src={asset.src} alt="" width={asset.width} height={asset.height} /></div><span>{asset.name}</span></div>)}</div> : <><div className="study-headline" /><div className="study-headline short" /><div className="study-line" /><div className="study-line short" /><div className="study-button" /></>}
          <div className="study-tiles"><span /><span /><span /></div>
        </div>
      </div>
    </div>
    <div className="study-phone"><span /><b>js.</b><div /><i /><i /><em /></div>
    <p>{portrait ? "A personal approach. From design to your next website." : showcase?.caption ?? "Thoughtful interfaces. Built for every screen."}</p>
  </div>;
}
