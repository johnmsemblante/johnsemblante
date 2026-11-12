import fields from "@/content/page-fields.json";
import type { PageField, PageId } from "./page-model";

export const pageCatalog: { id: PageId; title: string; path: string; fields: PageField[] }[] = [
  { id: "home", title: "Home", path: "/", fields: fields.home as PageField[] },
  { id: "about", title: "About", path: "/about/", fields: fields.about as PageField[] },
  { id: "work", title: "Work", path: "/work/", fields: fields.work as PageField[] },
  { id: "blog", title: "Blog", path: "/blog/", fields: fields.blog as PageField[] },
  { id: "ventures", title: "Ventures", path: "/ventures/", fields: fields.ventures as PageField[] },
  { id: "contact", title: "Contact", path: "/contact/", fields: fields.contact as PageField[] },
];
