import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h2 className="text-3xl font-bold mb-4">Stop wasting time on bad tickets</h2>
        <p className="text-[var(--text-secondary)] mb-8 text-lg">
          forge your first AEC in minutes. Free forever for individuals.
        </p>
        <Link
          href="/tickets"
          className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Try forge Free
        </Link>
      </div>
    </section>
  );
}
