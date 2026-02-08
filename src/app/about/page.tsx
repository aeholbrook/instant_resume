import { getAboutContent } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const content = await getAboutContent();

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-neutral-900 mb-10">About</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          {content ? (
            <MarkdownContent content={content} />
          ) : (
            <p className="text-neutral-400">
              Edit <code className="text-sm bg-neutral-100 px-2 py-1">content/about.md</code> to add your bio.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}