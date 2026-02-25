import Image from 'next/image';
import Link from 'next/link';
import { CopyCommand } from '@/core/components/CopyCommand';

function PlayIcon() {
  return (
    <svg className="w-8 h-8 text-[var(--text)] ml-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-6 h-6 text-[var(--text-secondary)] rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div data-theme="dark" className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]">
      {/* Header */}
      <header className="w-full border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <Image
              src="/forge-icon.png"
              alt="Forge Logo"
              width={32}
              height={32}
              className="drop-shadow-sm"
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-[var(--primary)] to-orange-500 text-transparent bg-clip-text">Forge</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/tickets"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-[var(--text)] px-4 text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90"
            >
              Go to App
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 border-b border-[var(--border-subtle)]">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-4xl text-[var(--text)]">
            <span className="bg-gradient-to-r from-[var(--primary)] via-blue-500 to-purple-500 text-transparent bg-clip-text">
              AI-native ticket management
            </span>
            <br className="hidden sm:block" />
            for PMs and developers.
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl leading-relaxed mx-auto">
            Web UI for product managers. CLI and MCP server for developers.
            AI enriches every ticket with implementation context automatically.
          </p>

          {/* Video Placeholder */}
          <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] overflow-hidden mb-10">
            {/* Replace this div with <video> when ready */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--text)]/10 flex items-center justify-center">
                <PlayIcon />
              </div>
              <p className="text-[var(--text-secondary)] text-sm">Demo video coming soon</p>
            </div>
          </div>

          <Link
            href="/tickets"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Try Forge Free
          </Link>
        </section>

        {/* Three Channels */}
        <section className="py-24 border-b border-[var(--border-subtle)]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Three ways to use Forge</h2>
              <p className="text-[var(--text-secondary)]">Pick the interface that fits how you work.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Web App */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5">
                  <MonitorIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">Web App</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Clean UI for product managers. Create tickets, add context, track progress.
                </p>
              </div>

              {/* CLI */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-5">
                  <TerminalIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">CLI + MCP Server</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Stay in terminal. Pull tickets, update status, enrich with local codebase analysis.
                </p>
                <CopyCommand command="npm install -g forge-ai-cli" />
              </div>

              {/* MCP Server */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
                  <PlugIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">MCP Server</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Your AI coding assistant (Cursor, Claude Code, Windsurf) gets full ticket context automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How it works</h2>
              <p className="text-[var(--text-secondary)]">One platform, three interfaces. PMs and developers finally in sync.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[var(--border-subtle)] via-[var(--primary)]/20 to-[var(--border-subtle)] -z-10" />

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mb-6 relative z-10">
                  <span className="text-3xl">1</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">PM</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">PM Creates</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Product manager creates a ticket in the web UI — just the intent.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mb-6 relative z-10">
                  <span className="text-3xl">2</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">AI</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Enriches</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Forge generates specs, test plans, and implementation details automatically.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mb-6 relative z-10">
                  <span className="text-3xl">3</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">Dev</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Dev Executes</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Developer&apos;s AI assistant gets full context via MCP. No copy-pasting.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border-subtle)] shadow-sm flex items-center justify-center mb-6 relative z-10">
                  <span className="text-3xl">4</span>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">Ship</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Ship & Sync</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Status syncs to web UI. PM approves. Everyone stays aligned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases — Works with your workflow */}
        <section className="py-24 border-b border-[var(--border-subtle)]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Works with your workflow</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                Use Forge alongside your current tools or as a full replacement. Your call.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Already use Jira/Linear */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Already use Jira or Linear?</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Create better tickets with AI, then export them to Jira or Linear with one click. Forge enhances your existing workflow.
                </p>
              </div>

              {/* Ready to replace Jira */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Ready to replace Jira?</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Full ticket management built in. Teams, statuses, assignments. No configuration hell.
                </p>
              </div>

              {/* Security-first */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Security-first?</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  PM creates in web, dev enriches locally via CLI. Code never leaves developer machines.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Start shipping better tickets</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">
              Join teams shipping faster with AI-native ticket management.
            </p>
            <Link
              href="/tickets"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Try Forge Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-12 text-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Image src="/forge-icon.png" alt="Forge" width={24} height={24} />
              <span className="font-bold text-base bg-gradient-to-r from-[var(--primary)] to-orange-500 text-transparent bg-clip-text">Forge</span>
            </div>
          </div>
          <p>&copy; {new Date().getFullYear()} Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
