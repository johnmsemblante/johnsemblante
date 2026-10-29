const steps = [
  ["01", "Understand", "Start with the audience, the purpose, and the problem to solve."],
  ["02", "Plan & design", "Shape the content, map the journey, and make the interface clear."],
  ["03", "Build", "Turn the design into responsive, accessible, maintainable code."],
  ["04", "Review & refine", "Test the experience, work through feedback, and prepare for launch."],
];
export function Workflow() {
  return <section className="section"><div className="section-heading"><div><p className="eyebrow">From idea to interface</p><h2>The approach.</h2></div></div><ol className="process-grid">{steps.map(([number, title, description]) => <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>;
}
