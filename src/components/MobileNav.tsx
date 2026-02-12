"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GalleryLink } from "@/lib/types";

export default function MobileNav({
  galleryLinks,
  logoUrl,
}: {
  galleryLinks: GalleryLink[];
  logoUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    ...galleryLinks.map((link) => ({ href: link.href, label: link.title })),
    { href: "/about/", label: "About" },
  ];

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt="Adam E Holbrook"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <span className="text-sm font-semibold text-neutral-900">Adam E Holbrook</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          className="p-2 text-neutral-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-white pt-16">
          <nav className="flex flex-col px-6 py-6 gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`text-base py-1 transition-colors ${
                  pathname === link.href || pathname === link.href.slice(0, -1)
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
