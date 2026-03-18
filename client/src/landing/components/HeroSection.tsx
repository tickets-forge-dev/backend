import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 border-b border-[var(--border-subtle)]">
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-4xl font-[var(--font-display)] text-red-500">
        Stop shipping half-baked tickets.
      </h1>

      <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl leading-relaxed mx-auto">
        forge turns rough ideas into complete, development-ready tickets — with code context, acceptance criteria, and everything your team needs to start building.
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
