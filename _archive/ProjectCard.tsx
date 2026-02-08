import Link from "next/link";
import Image from "next/image";
import { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}/`} className="group block">
      <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100 mb-3">
        {project.coverImage ? (
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="text-base font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
        {project.title}
      </h3>
      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
        {project.description}
      </p>
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {project.tags.map((tag) => (
            <span key={tag} className="text-xs text-neutral-400">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
