import { getAboutPage } from "@/lib/content";
import MarkdownContent from "@/components/MarkdownContent";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const aboutPage = await getAboutPage();

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-light text-neutral-900 mb-10">{aboutPage.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden">
            <Image
              src={aboutPage.imageUrl}
              alt="Adam E. Holbrook"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 100vw"
              priority
            />
          </div>
        </div>
        <div className="md:col-span-2">
          {aboutPage.content ? (
            <MarkdownContent content={aboutPage.content} />
          ) : (
            <p className="text-neutral-400">
              No about content is published yet. Add a row for{" "}
              <code className="text-sm bg-neutral-100 px-2 py-1">slug = 'about'</code> in the{" "}
              <code className="text-sm bg-neutral-100 px-2 py-1">pages</code> table.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
