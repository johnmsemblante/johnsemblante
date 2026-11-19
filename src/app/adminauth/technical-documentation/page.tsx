import { AdminDocumentation } from "@/components/admin/admin-documentation";
import { technicalGuides } from "@/content/technical-documentation";

export default function TechnicalDocumentationPage() {
  return <AdminDocumentation technicalGuides={technicalGuides} />;
}
