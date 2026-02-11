"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface FilmCarouselProps {
  images: string[];
  interval?: number;
}

export default function FilmCarousel({ images, interval = 4000 }: FilmCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  const radius = 260; // Radius of the carousel circle (reduced from 400)
  const angleStep = 360 / images.length;

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center pb-32 sm:pb-40 md:pb-48 pointer-events-none overflow-hidden">
      <div className="relative w-full max-w-2xl flex items-center justify-center -translate-x-12 sm:-translate-x-16 md:-translate-x-20" style={{ perspective: "1200px" }}>
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {images.map((src, index) => {
            // Calculate angle for this image on the circular carousel
            let angle = (index - currentIndex) * angleStep;

            // Normalize angle to be within -180 to 180 for smooth wrapping
            while (angle > 180) angle -= 360;
            while (angle < -180) angle += 360;

            // Calculate position on circle
            const radian = (angle * Math.PI) / 180;
            const x = Math.sin(radian) * radius;
            const z = Math.cos(radian) * radius - radius;

            // Show images in the front half of the circle
            const isVisible = Math.abs(angle) <= 90;

            // Calculate opacity based on angle (fade at edges) - more visible side images
            let opacity = 1;
            if (angle === 0) {
              opacity = 1; // Center image full opacity
            } else if (Math.abs(angle) > 50) {
              opacity = Math.max(0, 0.7 - (Math.abs(angle) - 50) / 80);
            } else {
              opacity = 0.7; // Side images at 70% opacity
            }

            // Scale down side images more
            const scale = angle === 0 ? 1 : 0.7;

            return (
              <div
                key={src}
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  transform: `
                    translateX(${x}px)
                    translateZ(${z}px)
                    rotateY(${-angle}deg)
                    scale(${scale})
                  `,
                  opacity: isVisible ? opacity : 0,
                  transformStyle: "preserve-3d",
                  left: "50%",
                  top: "50%",
                  marginLeft: "-72px",
                  marginTop: "-72px",
                  zIndex: Math.round(100 + z),
                }}
              >
                <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64">
                  <Image
                    src={src}
                    alt={`Film photo ${index + 1}`}
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="(max-width: 640px) 160px, (max-width: 768px) 192px, 256px"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
