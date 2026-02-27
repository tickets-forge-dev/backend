import Image from 'next/image';
import Link from 'next/link';
import { CopyCommand } from '@/core/components/CopyCommand';


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
              href="/docs"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              Docs
            </Link>
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
              Stop shipping half-baked tickets.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl leading-relaxed mx-auto">
            Forge turns messy ideas into verified execution contracts — so developers know exactly what to build.
          </p>

          <Link
            href="/tickets"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Try Forge Free
          </Link>
        </section>

        {/* What is an AEC? */}
        <section className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">The Agent Execution Contract</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                Every ticket Forge produces is an AEC — a verified, structured contract.
                Whether a developer or an AI agent picks it up, the contract is clear. No guessing. No back-and-forth.
              </p>
            </div>

            {/* AEC Screenshot */}
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

        {/* Two Interfaces */}
        <section className="py-24 border-b border-[var(--border-subtle)]">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Two interfaces, one platform</h2>
              <p className="text-[var(--text-secondary)]">PMs work in the browser. Developers work in the terminal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Web App — PM */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
                <Image
                  src="/images/ticket-screenshot.png"
                  alt="Forge web app showing the ticket list with statuses, priorities, and quality scores"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
                <div className="px-5 py-5 border-t border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-lg mb-2">Web App</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    Create tickets, add context, review answers, and approve — all from the browser. For PMs, QA, and anyone on the team.
                  </p>
                </div>
              </div>

              {/* CLI — Developer */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-left overflow-hidden">
                <Image
                  src="/images/cli-screenshot.png"
                  alt="Claude Code terminal with Forge MCP integration listing tickets and running review"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
                <div className="px-5 py-5 border-t border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-lg mb-2">CLI</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                    Run <code className="text-[var(--text)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-xs">forge login</code> to authenticate, then <code className="text-[var(--text)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-xs">forge mcp install</code> to connect your AI assistant. Once connected, run <code className="text-cyan-400">forge develop</code> for guided implementation prep — Forgy asks the right questions and creates your branch automatically.
                  </p>
                  <CopyCommand command="npm install -g @anthropic-forge/cli" />
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
              <p className="text-[var(--text-secondary)]">From messy idea to verified contract — through a forging pipeline.</p>
            </div>

            {/* Flow Diagram */}
            <div className="relative">
              {/* Desktop Flow */}
              <div className="hidden md:block">
                {/*
                  Layout (viewBox 900x520):
                  Row 1 (y=40):  N1 PM Drafts | N2 AI Clarifies | N3 Dev-Refine
                  Row 2 (y=190): N4 PM Approves (right-aligned under N3)
                  Row 3 (y=330): N5 AEC Forged (centered, large, prominent)
                  Row 4 (y=450): N6 Execute (centered)
                */}
                <svg viewBox="0 0 900 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
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
                    <marker id="arrow-amber" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
                    </marker>
                    <linearGradient id="aec-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* === PLANNING SIDE container === */}
                  <rect x="8" y="8" width="545" height="310" rx="16" fill="#7c3aed" fillOpacity="0.04" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
                  <text x="24" y="32" fill="#a78bfa" fontSize="12" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">PLANNING SIDE</text>

                  {/* === DEV SIDE container === */}
                  <rect x="570" y="8" width="322" height="310" rx="16" fill="#3b82f6" fillOpacity="0.04" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
                  <text x="586" y="32" fill="#60a5fa" fontSize="12" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">DEV SIDE</text>

                  {/* === ROW 1: PM Drafts → AI Clarifies → Dev-Refine === */}

                  {/* Arrow: N1 → N2 */}
                  <line x1="230" y1="90" x2="300" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />
                  {/* Arrow: N2 → N3 */}
                  <line x1="530" y1="90" x2="600" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

                  {/* Node 1: PM Drafts Intent */}
                  <rect x="20" y="50" width="210" height="80" rx="16" fill="#18181b" stroke="#7c3aed" strokeWidth="1.5" />
                  <text x="125" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Drafts Intent</text>
                  <text x="125" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">The idea, the &quot;what&quot; and &quot;why&quot;</text>
                  <circle cx="212" cy="52" r="12" fill="#7c3aed" />
                  <text x="212" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* Node 2: AI Clarifies */}
                  <rect x="300" y="50" width="230" height="80" rx="16" fill="#18181b" stroke="#8b5cf6" strokeWidth="1.5" />
                  <text x="415" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">AI Asks Questions</text>
                  <text x="415" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Gap analysis before dev touches it</text>
                  <circle cx="512" cy="52" r="12" fill="#8b5cf6" />
                  <text x="512" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">AI</text>

                  {/* Node 3: Dev-Refine */}
                  <rect x="600" y="50" width="230" height="80" rx="16" fill="#18181b" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="715" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Dev-Refine</text>
                  <text x="715" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Enriches with code context</text>
                  <circle cx="812" cy="52" r="12" fill="#3b82f6" />
                  <text x="812" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>

                  {/* === ROW 2: PM Approves === */}

                  {/* Arrow: N3 → N4 (down) */}
                  <line x1="715" y1="130" x2="715" y2="200" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

                  {/* Loop: N4 back to N3 (needs more context) */}
                  <path d="M 640 200 L 640 170 Q 640 160 650 160 L 780 160 Q 790 160 790 170 L 790 200" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" fill="none" markerEnd="url(#arrow-purple)" />
                  <text x="715" y="155" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="system-ui">needs more context</text>

                  {/* Node 4: PM Approves */}
                  <rect x="600" y="200" width="230" height="80" rx="16" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="715" y="232" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Approves</text>
                  <text x="715" y="256" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Validates intent is preserved</text>
                  <circle cx="812" cy="202" r="12" fill="#f59e0b" />
                  <text x="812" y="206" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

                  {/* === ROW 3: AEC FORGED (the star) === */}

                  {/* Arrow: N4 → N5 (approved) */}
                  <line x1="715" y1="280" x2="715" y2="340" stroke="#f59e0b" strokeWidth="2" />
                  <line x1="715" y1="340" x2="560" y2="380" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
                  <text x="660" y="338" fill="#f59e0b" fontSize="10" fontFamily="system-ui">approved</text>

                  {/* AEC Glow background */}
                  <rect x="240" y="375" width="340" height="95" rx="20" fill="url(#aec-glow)" />

                  {/* Node 5: AEC Forged */}
                  <rect x="250" y="380" width="320" height="85" rx="18" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
                  <text x="410" y="412" textAnchor="middle" fill="#f59e0b" fontSize="18" fontWeight="700" fontFamily="system-ui">AEC Forged</text>
                  <text x="410" y="434" textAnchor="middle" fill="#e4e4e7" fontSize="12" fontFamily="system-ui">Verified execution contract</text>
                  <text x="410" y="452" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="system-ui">AC &middot; APIs &middot; Scope &middot; Tech Context</text>

                  {/* === ROW 4: Guided Prep === */}

                  {/* Arrow: N5 → N5.5 */}
                  <line x1="410" y1="465" x2="410" y2="510" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrow-cyan)" />

                  {/* Node 5.5: Guided Prep */}
                  <rect x="310" y="510" width="200" height="60" rx="14" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
                  <text x="410" y="537" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Guided Prep</text>
                  <text x="410" y="555" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Forgy asks the right questions</text>
                  <circle cx="492" cy="512" r="12" fill="#06b6d4" />
                  <text x="492" y="516" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>

                  {/* === ROW 5: Execute === */}

                  {/* Arrow: N5.5 → N6 */}
                  <line x1="410" y1="570" x2="410" y2="610" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />

                  {/* Node 6: Execute */}
                  <rect x="310" y="610" width="200" height="60" rx="14" fill="#18181b" stroke="#10b981" strokeWidth="2" />
                  <text x="410" y="637" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Execute</text>
                  <text x="410" y="657" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">AI implements the spec</text>
                  <circle cx="492" cy="612" r="12" fill="#10b981" />
                  <text x="492" y="616" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>
                </svg>
              </div>

              {/* Mobile Flow (vertical) */}
              <div className="md:hidden flex flex-col items-center gap-3">
                {/* Planning Side label */}
                <div className="w-full max-w-[300px] rounded-xl border border-purple-500/25 border-dashed bg-purple-500/[0.04] px-4 py-2">
                  <p className="text-purple-400 text-xs font-bold tracking-wide">PLANNING SIDE</p>
                </div>

                {/* Node 1: PM Drafts */}
                <div className="w-full max-w-[300px] rounded-2xl border border-purple-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
                  <p className="font-semibold text-[15px] mb-1">PM Drafts Intent</p>
                  <p className="text-[var(--text-secondary)] text-xs">The idea — what and why</p>
                </div>
                <ArrowDownIcon />

                {/* Node 2: AI Clarifies */}
                <div className="w-full max-w-[300px] rounded-2xl border border-violet-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-[10px]">AI</div>
                  <p className="font-semibold text-[15px] mb-1">AI Asks Questions</p>
                  <p className="text-[var(--text-secondary)] text-xs">Gap analysis before dev touches it</p>
                </div>
                <ArrowDownIcon />

                {/* Dev Side label */}
                <div className="w-full max-w-[300px] rounded-xl border border-blue-500/25 border-dashed bg-blue-500/[0.04] px-4 py-2">
                  <p className="text-blue-400 text-xs font-bold tracking-wide">DEV SIDE</p>
                </div>

                {/* Node 3: Dev-Refine */}
                <div className="w-full max-w-[300px] rounded-2xl border border-blue-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
                  <p className="font-semibold text-[15px] mb-1">Dev-Refine</p>
                  <p className="text-[var(--text-secondary)] text-xs">Enriches with code context</p>
                </div>
                <ArrowDownIcon />

                {/* Node 4: PM Approves + loop */}
                <div className="w-full max-w-[300px] rounded-2xl border border-amber-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
                  <p className="font-semibold text-[15px] mb-1">PM Approves</p>
                  <p className="text-[var(--text-secondary)] text-xs">Validates intent is preserved</p>
                  <p className="text-purple-400 text-[11px] mt-2">&#8635; needs more context? back to Dev-Refine</p>
                </div>
                <ArrowDownIcon />

                {/* Node 5: AEC Forged (star) */}
                <div className="w-full max-w-[300px] rounded-2xl border-2 border-amber-500 bg-[#18181b] p-6 text-center relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                  <p className="font-bold text-[18px] mb-1 text-amber-400">AEC Forged</p>
                  <p className="text-[var(--text-secondary)] text-xs">Verified execution contract</p>
                  <p className="text-[var(--text-tertiary)] text-[10px] mt-1">AC &middot; APIs &middot; Scope &middot; Tech Context</p>
                </div>
                <ArrowDownIcon />

                {/* Node 5.5: Guided Prep */}
                <div className="w-full max-w-[300px] rounded-2xl border border-cyan-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
                  <p className="font-semibold text-[15px] mb-1">Guided Prep</p>
                  <p className="text-[var(--text-secondary)] text-xs">Forgy asks the right questions</p>
                </div>
                <ArrowDownIcon />

                {/* Node 6: Execute */}
                <div className="w-full max-w-[300px] rounded-2xl border border-green-500/50 bg-[#18181b] p-5 text-center relative">
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
                  <p className="font-semibold text-[15px] mb-1">Execute</p>
                  <p className="text-[var(--text-secondary)] text-xs">AI implements the spec</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Forge */}
        <section className="py-24 border-b border-[var(--border-subtle)]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Forge?</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                No other tool does what happens between &quot;I have an idea&quot; and &quot;build this.&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Developer-enriched tickets */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Developer-enriched tickets</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Your developer adds real code context — APIs, file paths, existing patterns — using their own tools. No other ticketing system does this.
                </p>
              </div>

              {/* Verified before execution */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Verified before execution</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  PM and developer both sign off. The AEC is a contract — not a wish list. What was promised is what gets built.
                </p>
              </div>

              {/* AI-guided implementation */}
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] text-left">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-5">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">AI-guided implementation</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Your developer runs <code className="text-cyan-400">forge develop</code> — an AI agent asks targeted implementation questions, then auto-creates the correct branch. No context lost between spec and code.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Stop wasting time on bad tickets</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg">
              Forge your first AEC in minutes. Free forever for individuals.
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

      {/* Ember Sprinkles — pixelated fire particles rising from footer */}
      <div className="relative w-full h-0 overflow-visible pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-0 right-0 h-[140px]">
          {/* Orange embers */}
          <div className="ember-particle w-[3px] h-[3px] bg-orange-500/70" style={{ left: '8%', '--ember-drift': '12px', '--ember-duration': '3.2s', '--ember-delay': '0s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-orange-400/50" style={{ left: '15%', '--ember-drift': '-8px', '--ember-duration': '2.8s', '--ember-delay': '1.4s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[3px] h-[3px] bg-orange-500/40" style={{ left: '22%', '--ember-drift': '15px', '--ember-duration': '4.0s', '--ember-delay': '0.6s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-amber-400/60" style={{ left: '30%', '--ember-drift': '-10px', '--ember-duration': '3.5s', '--ember-delay': '2.1s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[4px] h-[4px] bg-orange-600/30" style={{ left: '35%', '--ember-drift': '6px', '--ember-duration': '4.5s', '--ember-delay': '0.3s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-amber-500/50" style={{ left: '42%', '--ember-drift': '-14px', '--ember-duration': '3.0s', '--ember-delay': '1.8s' } as React.CSSProperties} />
          <div className="ember-particle w-[3px] h-[3px] bg-orange-400/60" style={{ left: '48%', '--ember-drift': '10px', '--ember-duration': '3.3s', '--ember-delay': '0.9s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[2px] h-[2px] bg-red-500/40" style={{ left: '55%', '--ember-drift': '-6px', '--ember-duration': '4.2s', '--ember-delay': '2.5s' } as React.CSSProperties} />
          <div className="ember-particle w-[3px] h-[3px] bg-amber-400/50" style={{ left: '60%', '--ember-drift': '8px', '--ember-duration': '2.9s', '--ember-delay': '0.2s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-orange-500/60" style={{ left: '67%', '--ember-drift': '-12px', '--ember-duration': '3.6s', '--ember-delay': '1.1s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[4px] h-[4px] bg-orange-400/30" style={{ left: '73%', '--ember-drift': '14px', '--ember-duration': '4.8s', '--ember-delay': '0.7s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-amber-500/50" style={{ left: '78%', '--ember-drift': '-9px', '--ember-duration': '3.1s', '--ember-delay': '2.3s' } as React.CSSProperties} />
          <div className="ember-particle w-[3px] h-[3px] bg-orange-500/40" style={{ left: '85%', '--ember-drift': '7px', '--ember-duration': '3.4s', '--ember-delay': '1.6s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[2px] h-[2px] bg-red-400/35" style={{ left: '90%', '--ember-drift': '-11px', '--ember-duration': '4.3s', '--ember-delay': '0.5s' } as React.CSSProperties} />
          {/* Extra sparse ones in gaps */}
          <div className="ember-particle w-[2px] h-[2px] bg-orange-300/40" style={{ left: '4%', '--ember-drift': '5px', '--ember-duration': '3.7s', '--ember-delay': '3.0s' } as React.CSSProperties} />
          <div className="ember-particle-slow w-[3px] h-[3px] bg-amber-500/35" style={{ left: '52%', '--ember-drift': '-7px', '--ember-duration': '4.1s', '--ember-delay': '1.0s' } as React.CSSProperties} />
          <div className="ember-particle w-[2px] h-[2px] bg-orange-400/45" style={{ left: '95%', '--ember-drift': '9px', '--ember-duration': '3.0s', '--ember-delay': '2.8s' } as React.CSSProperties} />
        </div>
      </div>

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
