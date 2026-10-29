"use client";
import { useState } from "react";
import type { Project } from "@/content/site";
import { ProjectGrid } from "./project-grid";
export function ProjectExplorer({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("All projects");
  const filters = ["All projects", ...new Set(projects.flatMap(project => project.technologies))];
  const visible = filter === "All projects" ? projects : projects.filter(project => project.technologies.includes(filter));
  return <><div className="project-filters" role="group" aria-label="Filter projects by technology">{filters.map(label => <button key={label} type="button" aria-pressed={filter === label} onClick={() => setFilter(label)}>{label}</button>)}</div><p className="project-count" role="status">{visible.length} {visible.length === 1 ? "project" : "projects"}</p><ProjectGrid projects={visible} headingLevel={2} /></>;
}
