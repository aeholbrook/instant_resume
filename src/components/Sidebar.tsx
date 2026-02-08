"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const galleryLinks = [
  { href: "/galleries/portraits/", label: "Portraits" },
  { href: "/galleries/landscapes/", label: "Landscapes" },
  { href: "/galleries/events/", label: "Events" },
  { href: "/galleries/weddings/", label: "Weddings" },
  { href: "/galleries/crab-orchard/", label: "Crab Orchard" },
  { href: "/galleries/scotland/", label: "Scotland" },
];

const otherLinks = [
  // { href: "/projects/", label: "Projects" }, // TODO: Re-enable projects section later
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About" },
  // { href: "/contact/", label: "Contact" }, // Removed - contact links on homepage
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 right-0 h-screen w-52 bg-white border-l border-neutral-100 flex flex-col px-6 py-8 z-40 max-lg:hidden">
      <Link href="/" className="block mb-8">
        <Image
          src="/images/logo.webp"
          alt="Adam E Holbrook"
          width={140}
          height={140}
          className="w-28 h-auto mx-auto"
          priority
        />
      </Link>

      <nav className="flex flex-col gap-1 text-right">
        {galleryLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm py-1 transition-colors ${
              pathname === link.href || pathname === link.href.slice(0, -1)
                ? "text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {link.label}
          </Link>
        ))}

        <div className="border-t border-neutral-100 my-3" />

        {otherLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm py-1 transition-colors ${
              pathname?.startsWith(link.href)
                ? "text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
