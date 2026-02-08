import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/lib/types";

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}/`} className="group block">
      <div className="aspect-[16/9] relative overflow-hidden bg-neutral-100 mb-3">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
      </div>
      <time className="text-xs text-neutral-400">{post.date}</time>
      <h3 className="text-base font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors mt-1">
        {post.title}
      </h3>
      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
        {post.description}
      </p>
    </Link>
  );
}
