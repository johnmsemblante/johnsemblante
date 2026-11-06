import { AdminBlog } from "@/components/admin/admin-blog";
import { publishedPosts } from "@/content/blog";
import { buildBlogPosts } from "@/lib/build-blog";

export default function AdminBlogPage() { return <AdminBlog reservedSlugs={publishedPosts().map(post => post.slug)} exportedSlugs={buildBlogPosts().map(post => post.slug)} />; }
