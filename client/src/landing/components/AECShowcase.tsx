export function AECShowcase() {
  return (
    <section className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Complete Tickets. Zero Guesswork.</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Every ticket forge produces is fully structured — acceptance criteria, technical context, API contracts, and file references included. Developers open it and start building. No back-and-forth.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-2xl">
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
