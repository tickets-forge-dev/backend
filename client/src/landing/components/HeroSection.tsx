import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20 border-b border-[var(--border-subtle)] overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, rgba(245,158,11,0.04) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Badge */}
      <div className="relative animate-fade-in mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI-powered ticket specs
        </span>
      </div>

      {/* Headline */}
      <h1
        className="relative text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 max-w-3xl animate-fade-in"
        style={{ animationDelay: '80ms', animationFillMode: 'both' }}
      >
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(135deg, #f97316, #f59e0b, #fbbf24)',
          }}
        >
          Dev-ready
        </span>{' '}
        <span className="text-[var(--text)]">tickets.</span>
        <br />
        <span className="text-[var(--text)]">Every single time.</span>
      </h1>

      {/* Subtitle */}
      <p
        className="relative text-base sm:text-lg text-[var(--text-secondary)] mb-7 max-w-lg leading-relaxed mx-auto animate-fade-in"
        style={{ animationDelay: '160ms', animationFillMode: 'both' }}
      >
        PMs miss technical context. Forge doesn&apos;t.
        <br className="hidden sm:block" />
        Dev-ready tickets from rough ideas, in minutes.
      </p>

      {/* CTA */}
      <div
        className="relative animate-fade-in"
        style={{ animationDelay: '240ms', animationFillMode: 'both' }}
      >
        <Link
          href="/tickets"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-7 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] active:scale-[0.97]"
        >
          Try Forge Free
        </Link>
      </div>

      {/* Demo video */}
      <div
        className="relative w-full max-w-3xl mt-10 animate-fade-in"
        style={{ animationDelay: '400ms', animationFillMode: 'both' }}
      >
        <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-2xl">
          <video
            src="/images/forge-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
