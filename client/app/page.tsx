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

function ArrowDownIcon() {
  return (
    <svg className="w-5 h-5 text-[#525252]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
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
            Web UI for product managers. CLI for developers.
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

        {/* Two Interfaces */}
        <section className="py-24 border-b border-[var(--border-subtle)]">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Two interfaces, one platform</h2>
              <p className="text-[var(--text-secondary)]">PMs work in the browser. Developers work in the terminal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Web App — PM */}
              <div className="p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5">
                  <MonitorIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">Web App</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Product managers create tickets, add context, review answers, and approve — all from the browser.
                </p>
                <p className="text-purple-400 text-xs font-medium">forge-ai.dev</p>
              </div>

              {/* CLI — Developer */}
              <div className="p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-5">
                  <TerminalIcon />
                </div>
                <h3 className="font-semibold text-lg mb-2">CLI</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Install, authenticate, and your AI coding assistant (Claude Code, Cursor, Windsurf) gets full ticket context via MCP.
                </p>
                <CopyCommand command="npm install -g @forge/cli" />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — Flow Diagram */}
        <section id="how-it-works" className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How it works</h2>
              <p className="text-[var(--text-secondary)]">From idea to shipped code — with a built-in feedback loop.</p>
              <p className="text-[var(--text-secondary)] text-sm mt-2 opacity-60">Web = purple &amp; amber nodes &middot; CLI = blue &amp; green nodes</p>
            </div>

            {/* Flow Diagram */}
            <div className="relative">
              {/* Desktop Flow */}
              <div className="hidden md:block">
                <svg viewBox="0 0 900 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                  {/* Flow arrows: Create → Review */}
                  <line x1="228" y1="90" x2="312" y2="90" stroke="#525252" strokeWidth="2" strokeDasharray="6 4" />
                  <polygon points="310,85 320,90 310,95" fill="#525252" />

                  {/* Flow arrows: Review → Approve */}
                  <line x1="508" y1="90" x2="592" y2="90" stroke="#525252" strokeWidth="2" strokeDasharray="6 4" />
                  <polygon points="590,85 600,90 590,95" fill="#525252" />

                  {/* Flow arrows: Approve → Execute */}
                  <line x1="788" y1="90" x2="810" y2="90" stroke="#525252" strokeWidth="2" />
                  <line x1="810" y1="90" x2="810" y2="200" stroke="#525252" strokeWidth="2" />
                  <line x1="810" y1="200" x2="720" y2="200" stroke="#525252" strokeWidth="2" />
                  <polygon points="722,195 712,200 722,205" fill="#525252" />

                  {/* Refinement loop: Approve back to Review */}
                  <path d="M 600 130 L 600 170 Q 600 180 590 180 L 330 180 Q 320 180 320 170 L 320 130" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                  <polygon points="315,132 320,122 325,132" fill="#a855f7" />
                  <text x="460" y="198" textAnchor="middle" fill="#a855f7" fontSize="12" fontFamily="system-ui">needs more context</text>

                  {/* Node 1: PM Creates + AI Enriches */}
                  <rect x="20" y="50" width="208" height="80" rx="16" fill="#18181b" stroke="#7c3aed" strokeWidth="1.5" />
                  <text x="124" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Creates</text>
                  <text x="124" y="104" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">AI enriches automatically</text>
                  <circle cx="210" cy="52" r="12" fill="#7c3aed" />
                  <text x="210" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* Node 2: Dev Reviews */}
                  <rect x="320" y="50" width="188" height="80" rx="16" fill="#18181b" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="414" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Dev Reviews</text>
                  <text x="414" y="104" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">AI asks clarifying questions</text>
                  <circle cx="490" cy="52" r="12" fill="#3b82f6" />
                  <text x="490" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>

                  {/* Node 3: PM Approves */}
                  <rect x="600" y="50" width="188" height="80" rx="16" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="694" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Approves</text>
                  <text x="694" y="104" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">Review &amp; sign off</text>
                  <circle cx="770" cy="52" r="12" fill="#f59e0b" />
                  <text x="770" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* Node 4: Dev Executes */}
                  <rect x="520" y="230" width="200" height="80" rx="16" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                  <text x="620" y="262" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Dev Executes</text>
                  <text x="620" y="284" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">Full context via MCP. Ship it.</text>
                  <circle cx="702" cy="232" r="12" fill="#10b981" />
                  <text x="702" y="236" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>
                </svg>
              </div>

              {/* Mobile Flow (vertical) */}
              <div className="md:hidden flex flex-col items-center gap-3">
                {/* Node 1 */}
                <div className="w-full max-w-[300px] rounded-2xl border border-purple-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
                  <p className="font-semibold text-[15px] mb-1">PM Creates</p>
                  <p className="text-[var(--text-secondary)] text-xs">AI enriches automatically</p>
                </div>
                <ArrowDownIcon />

                {/* Node 2 */}
                <div className="w-full max-w-[300px] rounded-2xl border border-blue-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
                  <p className="font-semibold text-[15px] mb-1">Dev Reviews</p>
                  <p className="text-[var(--text-secondary)] text-xs">AI asks clarifying questions</p>
                </div>
                <ArrowDownIcon />

                {/* Node 3 + loop indicator */}
                <div className="w-full max-w-[300px] rounded-2xl border border-amber-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
                  <p className="font-semibold text-[15px] mb-1">PM Approves</p>
                  <p className="text-[var(--text-secondary)] text-xs">Review &amp; sign off</p>
                  <p className="text-purple-400 text-[11px] mt-2">&#8635; needs more context? back to review</p>
                </div>
                <ArrowDownIcon />

                {/* Node 4 */}
                <div className="w-full max-w-[300px] rounded-2xl border-2 border-green-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
                  <p className="font-semibold text-[15px] mb-1">Dev Executes</p>
                  <p className="text-[var(--text-secondary)] text-xs">Full context via MCP. Ship it.</p>
                </div>
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
