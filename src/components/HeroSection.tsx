import Link from "next/link";
import Image from "next/image";
import FilmCarousel from "./FilmCarousel";
import { readdirSync } from "fs";
import { join } from "path";

// Get film carousel images from the public directory
function getFilmImages() {
  try {
    const filmDir = join(process.cwd(), "public/images/film-carousel");
    const files = readdirSync(filmDir);
    return files
      .filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
      .map((file) => `/images/film-carousel/${file}`);
  } catch {
    return [];
  }
}

export default function HeroSection() {
  const filmImages = getFilmImages();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Mobile/Tablet Layout - No absolute positioning */}
      <div className="lg:hidden w-full min-h-screen flex flex-col bg-white">
        {/* Portrait Image */}
        <div className="relative w-full flex-shrink-0">
          <Image
            src="/images/quarantine-self-portrait.webp"
            alt="Adam E Holbrook Portrait"
            width={800}
            height={1200}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 bg-white px-6 py-8 flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl font-light tracking-tight text-black mb-1">
              Adam E.
            </h1>
            <h1 className="text-4xl font-light tracking-tight text-black mb-4">
              Holbrook
            </h1>
            <p className="text-lg text-black/80 mb-6">
              Photographer & Visual Storyteller
            </p>
            <Link
              href="/galleries/portraits/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-black text-sm text-black hover:bg-black hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="uppercase tracking-widest">Galleries</span>
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <a
              href="https://github.com/aeholbrook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-base text-black hover:text-black/60 transition-colors group"
            >
              <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>@aeholbrook</span>
            </a>
            <a
              href="https://linkedin.com/in/aeholbrook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-base text-black hover:text-black/60 transition-colors group"
            >
              <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span>/in/aeholbrook</span>
            </a>
            <a
              href="https://substack.com/@aeholbrook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-base text-black hover:text-black/60 transition-colors group"
            >
              <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
              </svg>
              <span>@aeholbrook</span>
            </a>
            <a
              href="mailto:adam@aeholbrook.com"
              className="flex items-center gap-3 text-base text-black hover:text-black/60 transition-colors group"
            >
              <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span>adam@aeholbrook.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Keep absolute positioning */}
      <div className="hidden lg:block w-full h-screen relative">
        {/* Background Portrait Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/quarantine-self-portrait.webp"
            alt="Adam E Holbrook Portrait"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Film Carousel */}
        {filmImages.length > 0 && <FilmCarousel images={filmImages} interval={4000} />}

        {/* Name on the left */}
        <div className="absolute top-8 left-8 z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-black mb-1">
            Adam E.
          </h1>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-black mb-6">
            Holbrook
          </h1>
          <p className="text-lg md:text-xl text-black/80 mb-6">
            Photographer & Visual Storyteller
          </p>
          <Link
            href="/galleries/portraits/"
            className="inline-flex items-center gap-2 text-sm text-black hover:text-black/60 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="uppercase tracking-widest">Galleries</span>
          </Link>
        </div>

        {/* Social links - top right */}
        <div className="absolute top-8 right-8 z-10 flex flex-col gap-7 items-end">
          <a
            href="https://github.com/aeholbrook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-xl text-black hover:text-black/60 transition-colors group"
          >
            <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>@aeholbrook</span>
          </a>
          <a
            href="https://linkedin.com/in/aeholbrook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-xl text-black hover:text-black/60 transition-colors group"
          >
            <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            <span>/in/aeholbrook</span>
          </a>
          <a
            href="https://substack.com/@aeholbrook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-xl text-black hover:text-black/60 transition-colors group"
          >
            <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
            </svg>
            <span>@aeholbrook</span>
          </a>
          <a
            href="mailto:adam@aeholbrook.com"
            className="flex items-center gap-3 text-xl text-black hover:text-black/60 transition-colors group"
          >
            <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span>adam@aeholbrook.com</span>
          </a>
        </div>
      </div>
    </section>
  );
}
