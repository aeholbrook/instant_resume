import BlogPostCard from "@/components/BlogPostCard";
import { getBlogPosts } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-neutral-900 mb-10">Blog</h1>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-center py-12">
          No posts yet. Add published rows to <code className="text-sm bg-neutral-100 px-2 py-1">blog_posts</code>.
        </p>
      )}
    </section>
  );
}
