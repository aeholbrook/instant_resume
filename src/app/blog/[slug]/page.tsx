import { getBlogPostBySlug } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post" };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <time className="text-xs text-neutral-400">{post.date}</time>
      <h1 className="text-3xl font-light text-neutral-900 mt-2 mb-8">{post.title}</h1>

      {post.coverImage ? (
        <div className="relative aspect-[16/9] w-full bg-neutral-100 mb-8 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 800px, 100vw"
            priority
          />
        </div>
      ) : null}

      <MarkdownContent content={post.content} />
    </article>
  );
}
