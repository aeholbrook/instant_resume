import { getGallery, getGallerySlugs } from "@/lib/content";
import ImageGallery from "@/components/ImageGallery";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getGallerySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = getGallery(slug);
  return { title: gallery.title };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = getGallery(slug);

  return (
    <div className="p-3">
      {gallery.images.length > 0 ? (
        <ImageGallery images={gallery.images} />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-neutral-400 text-center">
            No photos yet. Add <code className="text-sm bg-neutral-100 px-2 py-1">.webp</code> files to{" "}
            <code className="text-sm bg-neutral-100 px-2 py-1">public/images/galleries/{slug}/</code>
          </p>
        </div>
      )}
    </div>
  );
}
