import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 border-b border-[var(--border-subtle)]">
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-4xl text-[var(--text)]">
        <span className="bg-gradient-to-r from-[var(--primary)] via-blue-500 to-purple-500 text-transparent bg-clip-text">
          Stop shipping half-baked tickets.
        </span>
      </h1>

      <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl leading-relaxed mx-auto">
        forge turns messy ideas into verified execution contracts — so developers know exactly what to build.
      </p>

      <Link
        href="/tickets"
        className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
      >
        Try forge Free
      </Link>
    </section>
  );
}
