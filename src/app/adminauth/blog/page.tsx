import { AdminBlog } from "@/components/admin/admin-blog";
import { publishedPosts } from "@/content/blog";

export default function AdminBlogPage() { return <AdminBlog reservedSlugs={publishedPosts().map(post => post.slug)} />; }
