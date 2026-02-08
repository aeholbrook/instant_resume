import { getProjectBySlug, getProjectSlugs } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import ImageGallery from "@/components/ImageGallery";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return {
    title: project.title,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      <Link
        href="/projects/"
        className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 inline-block"
      >
        &larr; All Projects
      </Link>

      <h1 className="text-3xl sm:text-4xl font-light text-neutral-900 mb-4">
        {project.title}
      </h1>

      <div className="flex items-center gap-4 mb-8">
        <time className="text-sm text-neutral-400">{project.date}</time>
        {project.tags.length > 0 && (
          <div className="flex gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-neutral-400 border border-neutral-200 px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {project.coverImage && (
        <div className="aspect-[16/9] relative overflow-hidden bg-neutral-100 mb-8">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <MarkdownContent content={project.content} />

      <ImageGallery images={project.images} />
    </article>
  );
}