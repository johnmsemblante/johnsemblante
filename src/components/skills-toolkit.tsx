"use client";

import { useId, useState } from "react";
import { profile } from "@/content/profile";
import { skillDetails, skillCategories } from "@/content/skill-details";

export function SkillsToolkit() {
  const [category, setCategory] = useState("All");
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const id = useId();
  const skills = [...profile.skills, ...profile.languages, ...profile.tools];
  const visible = skills.filter(name => category === "All" || skillDetails[name]?.category === category);

  return <div className="skills-toolkit" onKeyDown={event => {
    if (event.key === "Escape") { setActive(null); setPinned(null); }
  }}>
    <p className="toolkit-intro">The platforms, languages, and tools behind my work. Hover, focus, or tap an item to learn more.</p>
    <div className="toolkit-filters" role="group" aria-label="Filter skills by category">
      {["All", ...skillCategories].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => { setCategory(item); setActive(null); setPinned(null); }}>{item}</button>)}
    </div>
    <p className="toolkit-count" role="status">{visible.length} {visible.length === 1 ? "skill" : "skills"} · {category === "All" ? "All categories" : category}</p>
    <div className="toolkit-groups">
      {skillCategories.filter(group => category === "All" || category === group).map(group => <section key={group} className="toolkit-group" aria-label={group}>
        <h3>{group}</h3>
        <ul className="toolkit-grid">
          {visible.filter(name => skillDetails[name]?.category === group).map(name => {
            const detail = skillDetails[name];
            const tooltipId = `${id}-${skills.indexOf(name)}`;
            const expanded = active === name;
            return <li key={name} className="toolkit-item" data-active={expanded} onPointerEnter={event => { if (event.pointerType === "mouse") setActive(name); }} onPointerLeave={() => { if (pinned !== name) setActive(current => current === name ? null : current); }}>
              <button type="button" className="toolkit-card" aria-describedby={expanded ? tooltipId : undefined} aria-expanded={expanded} aria-controls={tooltipId} onFocus={() => setActive(name)} onBlur={() => { setActive(null); setPinned(null); }} onClick={() => {
                const next = pinned === name ? null : name;
                setPinned(next); setActive(next);
              }}>
                <span className="toolkit-icon"><img src={`/icons/skills/${detail.icon}.svg`} alt="" width={36} height={36} loading="lazy" /></span>
                <span className="toolkit-label">{name}</span>
                <span className="toolkit-info" aria-hidden="true">i</span>
              </button>
              <div id={tooltipId} role="tooltip" className="toolkit-tooltip" hidden={!expanded}>{detail.description}</div>
            </li>;
          })}
        </ul>
      </section>)}
    </div>
  </div>;
}
