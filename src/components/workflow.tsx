const steps = [
  ["01", "Understand", "Share your goals, design files or current site, and the problem you need to solve."],
  ["02", "Define the scope", "Clarify the pages, features, priorities, and constraints before development begins."],
  ["03", "Build", "Implement the agreed work with responsive layouts, reusable code, and attention to accessibility."],
  ["04", "Review & refine", "Check the work across screen sizes and browsers, address feedback, and prepare for handover."],
];
export function Workflow() {
  return <section className="section"><div className="section-heading"><div><p className="eyebrow">From idea to interface</p><h2>A clear path from brief to build.</h2></div></div><ol className="process-grid">{steps.map(([number, title, description]) => <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>;
}
