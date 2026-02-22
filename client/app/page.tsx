import Image from 'next/image';
import Link from 'next/link';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div data-theme="dark" className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]">
      {/* Header */}
      <header className="w-full border-b border-[var(--border)] sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-50">
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

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32 border-b border-[var(--border)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] text-sm text-[var(--text-secondary)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            The AI-native alternative to Jira
          </div>
          
          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-[var(--text)]">
            Project management for<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[var(--primary)] via-blue-500 to-purple-500 text-transparent bg-clip-text">
              the AI coding era.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl leading-relaxed mx-auto">
            Forge connects PMs and developers through AI. A clean web UI for product managers. 
            A powerful CLI that integrates with Cursor, Claude, and Windsurf for developers. 
            No more heavy Jira workflows — just ship.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link
              href="/tickets"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Try Forge Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-8 text-base font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-hover)]"
            >
              See How it Works
            </Link>
          </div>

          {/* Two interfaces preview */}
          <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">Web UI for PMs</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Clean, simple, no bloat</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Create tickets, add context, approve work. AI enriches everything with code analysis, API specs, and test plans automatically.</p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold">CLI for Developers</h3>
                  <p className="text-sm text-[var(--text-secondary)]">MCP-powered AI integration</p>
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Run <code className="text-xs bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">forge execute</code> and your AI coding assistant gets full ticket context via MCP protocol.</p>
            </div>
          </div>
        </section>

        {/* How It Works Steps */}
        <section id="how-it-works" className="py-24 border-b border-[var(--border)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How Teams Ship with Forge</h2>
              <p className="text-[var(--text-secondary)]">One platform, two interfaces. PMs and developers finally in sync.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[var(--border)] via-[var(--primary)]/20 to-[var(--border)] -z-10" />

              {/* Step 1: Create */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  📝
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">1</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">PM Creates</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Product manager creates a ticket in the <span className="font-medium">web UI</span> — just the intent, nothing more.
                </p>
              </div>

              {/* Step 2: AI Enriches */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  🧠
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">2</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Enriches</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Forge analyzes context — or your codebase if connected — and generates specs, test plans, and details automatically.
                </p>
              </div>

              {/* Step 3: Dev Executes */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  ⚡
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">3</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Dev Executes</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Developer runs <code className="text-xs bg-[var(--bg)] px-1 py-0.5 rounded border border-[var(--border)]">forge execute</code> — AI assistant gets full context via <span className="font-medium">MCP</span>.
                </p>
              </div>

              {/* Step 4: Ship */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  🚀
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">4</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Ship & Sync</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Status syncs to web UI. PM approves. <span className="font-medium">No Jira ceremony</span>, just shipping.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Works for Every Team Section */}
        <section className="py-24 border-b border-[var(--border)]">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Works for Every Team</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                Whether you&apos;re a non-technical PM, a hands-on technical lead, or a security-first enterprise — Forge adapts to how your team works.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Non-technical PM */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 text-xs font-medium px-3 py-1 rounded-bl-lg">
                  No code access needed
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl mb-5 mt-4">
                  💡
                </div>
                <h3 className="font-semibold text-lg mb-3">Non-Technical PM</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Describe what you want to build. Upload PRDs, designs, or just write a few sentences. 
                  <span className="text-[var(--text)] font-medium"> AI transforms your intent into developer-ready tickets</span> with acceptance criteria, edge cases, and test scenarios.
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>No GitHub connection required</span>
                </div>
              </div>

              {/* Technical PM */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Maximum context
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl mb-5 mt-4">
                  🔌
                </div>
                <h3 className="font-semibold text-lg mb-3">Technical PM</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Connect your GitHub repo from the web UI. 
                  <span className="text-[var(--text)] font-medium"> AI analyzes your actual codebase</span> — architecture, patterns, existing APIs — and generates tickets with precise file paths, API contracts, and integration points.
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>GitHub integration in web UI</span>
                </div>
              </div>

              {/* Security-first Enterprise */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] relative overflow-hidden group hover:border-green-500/50 transition-colors">
                <div className="absolute top-0 right-0 bg-green-500/10 text-green-400 text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Code stays local
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl mb-5 mt-4">
                  🔒
                </div>
                <h3 className="font-semibold text-lg mb-3">Security-First Teams</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
                  Don&apos;t want to give web access to your repo? No problem. 
                  <span className="text-[var(--text)] font-medium"> PM creates tickets in web UI, developer enriches locally</span> via CLI. Your code never leaves developer machines.
                </p>
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Web → CLI handoff, zero code exposure</span>
                </div>
              </div>
            </div>

            {/* Visual flow diagram */}
            <div className="mt-12 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/50">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-purple-400">PM</span>
                  <span className="text-[var(--text-secondary)]">creates ticket</span>
                </div>
                <svg className="w-6 h-6 text-[var(--text-secondary)] rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-400">AI</span>
                  <span className="text-[var(--text-secondary)]">enriches with context</span>
                </div>
                <svg className="w-6 h-6 text-[var(--text-secondary)] rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400">Dev</span>
                  <span className="text-[var(--text-secondary)]">executes via CLI + AI</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Teams Switch from Jira</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                Built for 2026. AI-native from day one. No 20-year legacy to carry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: MCP Integration */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">MCP Protocol Native</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  First project tool built for AI coding assistants. Cursor, Claude Code, Windsurf — they all connect via <span className="font-medium">Model Context Protocol</span>.
                </p>
              </div>

              {/* Feature 2: Dual Interface */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Two Interfaces, One Platform</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  PMs get a clean web UI. Developers get a powerful CLI. Both stay in sync without anyone context-switching.
                </p>
              </div>

              {/* Feature 3: AI Code Analysis */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Deep Code Analysis</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  AI analyzes your repo structure, tech stack, and patterns. Tickets get enriched with real implementation context.
                </p>
              </div>

              {/* Feature 4: No Jira Complexity */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Zero Configuration Hell</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  No custom fields, workflows, or schemes to configure. Create a team, start shipping. It just works.
                </p>
              </div>

              {/* Feature 5: Real-time Sync */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Web ↔ CLI Sync</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  When a dev updates status from CLI, PM sees it instantly in the web UI. No refresh needed, no manual updates.
                </p>
              </div>

              {/* Feature 6: Agent-Ready Output */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Agent-Ready Artifacts</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Every ticket generates structured XML contracts that AI coding agents execute without hallucinations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24 border-t border-b border-[var(--border)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Forge vs. The Old Way</h2>
              <p className="text-[var(--text-secondary)]">Project management evolved for AI-assisted development.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Old Way */}
              <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                <h3 className="font-semibold text-lg mb-4 text-red-400">❌ Heavy Jira Workflows</h3>
                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>Configure 50 custom fields before you start</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>Developers context-switch to browser constantly</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>Copy-paste ticket details into AI assistants</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>Manual status updates, stale information</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-400">•</span>
                    <span>AI has no context about your codebase</span>
                  </li>
                </ul>
              </div>

              {/* New Way */}
              <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
                <h3 className="font-semibold text-lg mb-4 text-green-400">✓ Forge AI-Native</h3>
                <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>Create team, start working — no setup ceremony</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>Developers stay in terminal with <code className="text-xs bg-[var(--bg)] px-1 rounded">forge</code> CLI</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>MCP streams ticket context to Cursor/Claude directly</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>Real-time sync between CLI and web UI</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">•</span>
                    <span>AI understands your repo, patterns, architecture</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4">Simple Pricing for Teams</h2>
              <p className="text-[var(--text-secondary)]">Start free. Scale when you&apos;re ready.</p>
            </div>
            
            {/* Value proposition callout */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-green-500/30 bg-green-500/5">
                <span className="text-2xl">💡</span>
                <span className="text-sm text-[var(--text)]">
                  <span className="font-semibold text-green-400">Pay for PMs, not developers.</span>
                  <span className="text-[var(--text-secondary)]"> One PM seat can create tickets for unlimited devs via CLI.</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex flex-col">
                <h3 className="font-semibold text-xl mb-2">Starter</h3>
                <div className="text-4xl font-bold mb-6">$0<span className="text-base font-normal text-[var(--text-secondary)]">/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">For individuals and small experiments.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg border border-[var(--border)] text-center text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
                  Get Started
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>5 tickets / month</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Web UI + CLI access</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Basic AI enrichment</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-xl border border-[var(--primary)] bg-[var(--bg-subtle)] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[var(--primary)] text-[var(--primary-bg)] text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <h3 className="font-semibold text-xl mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-6">$12<span className="text-base font-normal text-[var(--text-secondary)]">/PM/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">One PM, unlimited developers via CLI.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg bg-[var(--text)] text-[var(--bg)] text-center text-sm font-medium hover:opacity-90 transition-opacity">
                  Start Free Trial
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Unlimited tickets</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span className="font-medium text-green-400">Unlimited dev CLI access</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Full MCP integration</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Deep code analysis</span>
                  </li>
                </ul>
              </div>

              {/* Team Tier */}
              <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex flex-col">
                <h3 className="font-semibold text-xl mb-2">Team</h3>
                <div className="text-4xl font-bold mb-6">$39<span className="text-base font-normal text-[var(--text-secondary)]">/PM/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">Multiple PMs + full team features.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg border border-[var(--border)] text-center text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
                  Contact Us
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Multiple PM seats</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Team workspaces</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 text-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Image src="/forge-icon.png" alt="Forge" width={24} height={24} />
              <span className="font-bold text-base bg-gradient-to-r from-[var(--primary)] to-orange-500 text-transparent bg-clip-text">Forge</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/pricing" className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              Pricing
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
