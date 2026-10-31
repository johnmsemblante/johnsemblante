type Portrait = { src: string; name: string };

/** A layout illustration; the homepage variant introduces the site's owner. */
export function BrowserIllustration({ portrait }: { portrait?: Portrait }) {
  return <div className={`browser-study${portrait ? " personal-study" : ""}`} role={portrait ? "img" : undefined} aria-label={portrait ? `${portrait.name}, the developer behind this website, pictured inside a responsive website illustration` : undefined} aria-hidden={portrait ? undefined : true}>
    <div className="study-window">
      <div className="study-toolbar"><i /><i /><i /><span /></div>
      <div className="study-content">
        <div className="study-sidebar"><b>js.</b><i /><i /><i /></div>
        <div className="study-canvas">
          <div className="study-label">{portrait ? "THE PERSON BEHIND THE PIXELS" : "IDEA → EXPERIENCE"}</div>
          {portrait ? <div className="study-introduction">
            <div className="study-person-copy"><span>Hello, I’m</span><strong>{portrait.name}</strong><span className="study-person-role">WordPress &amp;<br />front-end developer</span><div className="study-button" /></div>
            <div className="study-portrait-frame"><img src={portrait.src} alt="" width={247} height={319} /></div>
          </div> : <><div className="study-headline" /><div className="study-headline short" /><div className="study-line" /><div className="study-line short" /><div className="study-button" /></>}
          <div className="study-tiles"><span /><span /><span /></div>
        </div>
      </div>
    </div>
    <div className="study-phone"><span /><b>js.</b><div /><i /><i /><em /></div>
    <p>{portrait ? "A personal approach. From design to your next website." : "Thoughtful interfaces. Built for every screen."}</p>
  </div>;
}
