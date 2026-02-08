import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center bg-neutral-50">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/0 to-white/80" />
      <div className="relative text-center px-6">
        <Image
          src="/images/logo.webp"
          alt="Adam E Holbrook"
          width={180}
          height={180}
          className="w-44 h-auto mx-auto mb-6 lg:hidden"
          priority
        />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-neutral-900 mb-4">
          Adam E Holbrook
        </h1>
        <p className="text-lg text-neutral-500 max-w-md mx-auto mb-8">
          Photography &amp; creative projects
        </p>
        <Link
          href="/galleries/portraits/"
          className="inline-block px-6 py-3 text-sm border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
        >
          View Galleries
        </Link>
      </div>
    </section>
  );
}
