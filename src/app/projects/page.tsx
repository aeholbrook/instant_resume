import ProjectCard from "@/components/ProjectCard";
import { getProjects } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-neutral-900 mb-10">Projects</h1>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-neutral-400 text-center py-12">
          No projects yet. Add markdown files to <code className="text-sm bg-neutral-100 px-2 py-1">content/projects/</code> to get started.
        </p>
      )}
    </section>
  );
}