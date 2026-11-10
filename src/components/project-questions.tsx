import Link from "next/link";

const questions = [
  ["Can you work on my existing WordPress website?", "Yes. My work includes theme changes, WooCommerce customization, layout fixes, and plugin-related issues. Send the website link and describe the change or problem. I’ll need to review the current setup before agreeing on the work."],
  ["Do I need finished designs before getting in touch?", "No. Figma files are helpful for a design-to-development project, but you can also start with an existing website and a list of changes. Tell me what content and designs you already have so we can identify what else the project needs."],
  ["Can we work together remotely?", "I’m based in Cebu, Philippines, on UTC+8, and welcome remote projects and development roles. Share your team’s time zone, required working hours, and preferred way to communicate so we can check whether the arrangement fits."],
  ["What should I send to discuss cost and timing?", "Include your website or design link, the pages or features involved, your preferred deadline, and a budget range if you have one. Cost and timing depend on the scope, the existing setup, and what is ready to use. You don’t need to know all the technical details to start the conversation."],
];

export function ProjectQuestions() {
  return <section className="section" aria-labelledby="project-questions-title">
    <div className="section-heading"><div><p className="eyebrow">Before we start</p><h2 id="project-questions-title">Questions about working together.</h2></div></div>
    <div className="venture-faq">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    <p className="body-copy">Have a different question? <Link className="text-link" href="/contact/">Send me a message</Link>.</p>
  </section>;
}
