import HeroSection from "@/components/HeroSection";
import ProjectCard from "@/components/ProjectCard";
import { getProjects } from "@/lib/content";
import Link from "next/link";

export default async function HomePage() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured).slice(0, 6);
  const displayProjects = featured.length > 0 ? featured : projects.slice(0, 6);

  return (
    <>
      <HeroSection />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-light text-neutral-900">Selected Work</h2>
          <Link
            href="/projects/"
            className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            View all
          </Link>
        </div>

        {displayProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 text-center py-12">
            No projects yet. Add markdown files to <code className="text-sm bg-neutral-100 px-2 py-1">content/projects/</code> to get started.
          </p>
        )}
      </section>
    </>
  );
}