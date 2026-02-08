import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Portrait Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/galleries/portraits/quarantine+self+portrait+sm.webp"
          alt="Adam E Holbrook Portrait"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Content positioned on the left */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black mb-1">
          Adam
        </h1>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-black mb-6">
          Holbrook
        </h1>
        <p className="text-lg sm:text-xl text-black/80 mb-6">
          Photographer & Visual Storyteller
        </p>
        <Link
          href="/galleries/portraits/"
          className="inline-block px-6 py-3 text-sm border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          View Galleries
        </Link>
      </div>
    </section>
  );
}
