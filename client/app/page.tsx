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
            Tickets that actually help developers ship.
            Built for teams that move fast.
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
              {/* Web App — PM: browser chrome mockup */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1e] border-b border-[var(--border-subtle)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="bg-[#27272a] rounded-md px-3 py-1 text-[11px] text-[#71717a] text-center truncate">
                      forge-ai.dev/tickets
                    </div>
                  </div>
                </div>
                {/* Dashboard mockup */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                    </div>
                    <span className="text-[11px] text-[#71717a] font-medium">MY TICKETS</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#27272a]/60">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[12px] text-[#a1a1aa] flex-1 truncate">Add user auth flow</span>
                      <span className="text-[10px] text-amber-400/70 font-medium">REVIEW</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#27272a]/60">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[12px] text-[#a1a1aa] flex-1 truncate">Refactor payment module</span>
                      <span className="text-[10px] text-green-400/70 font-medium">READY</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#27272a]/60">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-[12px] text-[#a1a1aa] flex-1 truncate">Dashboard analytics page</span>
                      <span className="text-[10px] text-purple-400/70 font-medium">DRAFT</span>
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div className="px-5 pb-6 pt-2 border-t border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-lg mb-2">Web App</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Create tickets, add context, review answers, and approve — all from the browser. For PMs, QA, and anyone on the team.
                  </p>
                </div>
              </div>

              {/* CLI — Developer: terminal mockup */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
                {/* Terminal chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0c0c0e] border-b border-[var(--border-subtle)]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-[11px] text-[#71717a] font-medium ml-2">Terminal</span>
                </div>
                {/* Terminal content */}
                <div className="px-5 pt-4 pb-2 bg-[#0c0c0e] font-mono text-[12px] leading-relaxed">
                  <p><span className="text-green-400">$</span> <span className="text-[#e4e4e7]">npm install -g @forge/cli</span></p>
                  <p className="text-[#71717a]">added 42 packages in 3s</p>
                  <p className="mt-2"><span className="text-green-400">$</span> <span className="text-[#e4e4e7]">forge login</span></p>
                  <p className="text-[#71717a]">Open browser: https://forge-ai.dev/device</p>
                  <p className="text-green-400">Logged in as dev@team.com</p>
                  <p className="mt-2"><span className="text-green-400">$</span> <span className="text-[#e4e4e7]">forge mcp install</span></p>
                  <p className="text-green-400">MCP server registered for Claude Code</p>
                  <p className="mt-2 text-[#525252]">{/* cursor blink */}<span className="inline-block w-2 h-4 bg-green-400/70 animate-pulse" /></p>
                </div>
                {/* Description */}
                <div className="px-5 pb-6 pt-4 border-t border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-lg mb-2">CLI</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    Install, authenticate, and your AI coding assistant (Claude Code, Cursor, Windsurf) gets full ticket context via MCP.
                  </p>
                  <CopyCommand command="npm install -g @forge/cli" />
                </div>
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
            </div>

            {/* Flow Diagram */}
            <div className="relative">
              {/* Desktop Flow */}
              <div className="hidden md:block">
                {/*
                  Layout grid (viewBox 860x340):
                  N1: rect(30,50,210,80)   right-center = (240,90)
                  N2: rect(310,50,210,80)  left-center = (310,90)  bottom-center = (415,130)
                  N3: rect(590,50,220,80)  left-center = (590,90)  bottom-center = (700,130)
                  N4: rect(590,250,220,80) top-center = (700,250)
                */}
                <svg viewBox="0 0 860 350" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                  <defs>
                    <marker id="arrow-gray" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#525252" />
                    </marker>
                    <marker id="arrow-purple" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                    </marker>
                    <marker id="arrow-green" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                    </marker>
                  </defs>

                  {/* Arrow: N1 → N2 */}
                  <line x1="240" y1="90" x2="310" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

                  {/* Arrow: N2 → N3 */}
                  <line x1="520" y1="90" x2="590" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

                  {/* Arrow: N3 → N4 (approved) */}
                  <line x1="700" y1="130" x2="700" y2="250" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
                  <text x="722" y="195" fill="#10b981" fontSize="11" fontFamily="system-ui">approved</text>

                  {/* Loop: N3 bottom → back to N2 bottom (needs more context) */}
                  <path d="M 640 130 L 640 190 Q 640 200 630 200 L 425 200 Q 415 200 415 190 L 415 130" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" fill="none" markerEnd="url(#arrow-purple)" />
                  <text x="527" y="220" textAnchor="middle" fill="#a855f7" fontSize="11" fontFamily="system-ui">needs more context</text>

                  {/* Node 1: PM Creates + AI Enriches */}
                  <rect x="30" y="50" width="210" height="80" rx="16" fill="#18181b" stroke="#7c3aed" strokeWidth="1.5" />
                  <text x="135" y="84" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Creates</text>
                  <text x="135" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">AI enriches automatically</text>
                  <circle cx="222" cy="52" r="12" fill="#7c3aed" />
                  <text x="222" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* Node 2: Dev Reviews */}
                  <rect x="310" y="50" width="210" height="80" rx="16" fill="#18181b" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="415" y="84" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Dev Reviews</text>
                  <text x="415" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">AI asks clarifying questions</text>
                  <circle cx="502" cy="52" r="12" fill="#3b82f6" />
                  <text x="502" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>

                  {/* Node 3: PM Approves */}
                  <rect x="590" y="50" width="220" height="80" rx="16" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="700" y="84" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Approves</text>
                  <text x="700" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">Review &amp; sign off</text>
                  <circle cx="792" cy="52" r="12" fill="#f59e0b" />
                  <text x="792" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* Node 4: Dev Executes */}
                  <rect x="590" y="250" width="220" height="80" rx="16" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                  <text x="700" y="284" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Dev Executes</text>
                  <text x="700" y="306" textAnchor="middle" fill="#a1a1aa" fontSize="12" fontFamily="system-ui">Full context via MCP. Ship it.</text>
                  <circle cx="792" cy="252" r="12" fill="#10b981" />
                  <text x="792" y="256" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>
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
