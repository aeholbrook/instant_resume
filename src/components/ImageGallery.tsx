"use client";

import { useState } from "react";

export default function ImageGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="columns-2 md:columns-3 gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            className="mb-3 block w-full cursor-pointer break-inside-avoid"
            onClick={() => setSelected(src)}
          >
            <img
              src={src}
              alt={`Gallery image ${i + 1}`}
              loading="lazy"
              className="w-full h-auto hover:opacity-90 transition-opacity duration-300"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selected}
            alt="Selected image"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </>
  );
}
