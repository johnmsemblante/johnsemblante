const steps = [
  ["01", "Show me the starting point", "Share your current website or design files. Tell me what isn’t working and what you’d like to change."],
  ["02", "Agree on the work", "We’ll go through the pages, features, timeline, and any existing tools the website needs to work with."],
  ["03", "Build & check", "I develop the agreed changes and check layouts, interactions, and keyboard access as I go."],
  ["04", "Review together", "You review the work, I address the agreed feedback, and we check the affected pages before handover."],
];
export function Workflow() {
  return <section className="section"><div className="section-heading"><div><p className="eyebrow">Working together</p><h2>How I approach a website project.</h2></div></div><ol className="process-grid">{steps.map(([number, title, description]) => <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>;
}
