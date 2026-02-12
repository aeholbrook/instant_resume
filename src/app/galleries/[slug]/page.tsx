import { getGallery } from "@/lib/content";
import ImageGallery from "@/components/ImageGallery";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) {
    return { title: "Gallery" };
  }

  return { title: gallery.title };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) {
    notFound();
  }

  return (
    <div className="p-3">
      {gallery.images.length > 0 ? (
        <ImageGallery images={gallery.images} />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-neutral-400 text-center">
            No photos yet. Add rows to{" "}
            <code className="text-sm bg-neutral-100 px-2 py-1">gallery_images</code> for{" "}
            <code className="text-sm bg-neutral-100 px-2 py-1">gallery_slug = '{slug}'</code>.
          </p>
        </div>
      )}
    </div>
  );
}
