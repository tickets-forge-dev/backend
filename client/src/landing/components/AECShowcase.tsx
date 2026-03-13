import Image from 'next/image';

export function AECShowcase() {
  return (
    <section className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">The Agent Execution Contract</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Every ticket Forge produces is an AEC — a verified, structured contract.
            Whether a developer or an AI agent picks it up, the contract is clear. No guessing. No back-and-forth.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-2xl">
          <Image
            src="/images/aec-screenshot.png"
            alt="A real Forge AEC ticket showing acceptance criteria, API contracts, scope, and technical context"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}
