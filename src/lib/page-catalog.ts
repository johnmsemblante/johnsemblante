import fields from "@/content/page-fields.json";
import { aboutDevelopment, workDevelopment } from "@/content/development-story";
import { fieldKey } from "./page-model";
import type { PageField, PageId } from "./page-model";

function textDefaults(group: string, entries: { scope: string; label: string; value: string }[]): PageField[] {
  return entries.map(({ scope, label, value }) => ({ key: fieldKey(scope, value), group, label, kind: "text", value }));
}

export const pageCatalog: { id: PageId; title: string; path: string; fields: PageField[] }[] = [
  { id: "home", title: "Home", path: "/", fields: fields.home as PageField[] },
  { id: "about", title: "About", path: "/about/", fields: [...fields.about as PageField[], ...textDefaults("AI-assisted development", Object.values(aboutDevelopment))] },
  { id: "work", title: "Work", path: "/work/", fields: [...fields.work as PageField[], ...textDefaults("Independent builds", Object.values(workDevelopment))] },
  { id: "blog", title: "Blog", path: "/blog/", fields: fields.blog as PageField[] },
  { id: "ventures", title: "Ventures", path: "/ventures/", fields: fields.ventures as PageField[] },
  { id: "contact", title: "Contact", path: "/contact/", fields: fields.contact as PageField[] },
];
