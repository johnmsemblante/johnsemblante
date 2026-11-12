import { PageText } from "@/components/page-content";
const steps = [
  ["01", "Start with your website", "Show me the current site or design files. Tell me who uses it, what they need to do, and where you need help."],
  ["02", "Define the scope", "We’ll identify the pages and features involved, discuss your deadline, and check which existing tools the work depends on."],
  ["03", "Build and test", "I work through the agreed changes and check the affected layouts and interactions, including mobile screens and keyboard use."],
  ["04", "Review before launch", "You review the changes against the scope. We’ll work through feedback and agree on any remaining items before handover."],
];
export function Workflow() {
  return <section className="section"><div className="section-heading"><div><p className="eyebrow"><PageText scope="workflow_1" fallback={"Working together"} /></p><h2><PageText scope="workflow_2" fallback={"How I approach a website project."} /></h2></div></div><ol className="process-grid">{steps.map(([number, title, description]) => <li key={number}><span className="step-number"><PageText scope="workflow_3" fallback={number} /></span><h3><PageText scope="workflow_4" fallback={title} /></h3><p><PageText scope="workflow_5" fallback={description} /></p></li>)}</ol></section>;
}
