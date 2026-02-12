import { redirect } from "next/navigation";
import { getGalleryLinks } from "@/lib/content";

export const revalidate = 60;

export default async function GalleriesPage() {
  const links = await getGalleryLinks();
  redirect(links[0]?.href ?? "/");
}
