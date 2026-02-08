import { getBlogPostBySlug, getBlogSlugs } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
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

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link
        href="/blog/"
        className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 inline-block"
      >
        &larr; All Posts
      </Link>

      <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
        {post.title}
      </h1>

      <time className="text-sm text-neutral-400 block mb-8">{post.date}</time>

      {post.coverImage && (
        <div className="aspect-[16/9] relative overflow-hidden bg-neutral-100 mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <MarkdownContent content={post.content} />
    </article>
  );
}