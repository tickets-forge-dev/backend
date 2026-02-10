import Image from 'next/image';
import Link from 'next/link';
import { HeroAnimation } from '@/src/tickets/components/HeroAnimation';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]">
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
            <span className="font-semibold text-lg tracking-tight">Forge</span>
          </div>
          <div className="flex items-center gap-4">
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
          <div className="inline-block mb-4 px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--primary)]/5">
            <span className="text-sm font-medium text-[var(--primary)]">✨ Bidirectional Jira & Linear Sync</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-[var(--text)]">
            Ship features, not PRDs. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[var(--primary)] via-blue-500 to-purple-500 text-transparent bg-clip-text">
              Code-aware specs in seconds.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl leading-relaxed mx-auto">
            Import Jira & Linear issues. Enrich them with deep code analysis. Export executable specs.
            Forge turns vague requirements into detailed technical specs that AI agents and developers actually execute.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Link 
              href="/tickets" 
              className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--text)] px-8 text-base font-medium text-[var(--bg)] transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Start Building for Free
            </Link>
            <Link 
              href="#how-it-works" 
              className="inline-flex h-12 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-8 text-base font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-hover)]"
            >
              How it Works
            </Link>
          </div>

          {/* Animated pipeline visualization */}
          <div className="mt-16 w-full opacity-50 hover:opacity-100 transition-opacity duration-700">
            <HeroAnimation />
          </div>
        </section>

        {/* How It Works Steps */}
        <section id="how-it-works" className="py-24 border-b border-[var(--border)] bg-[var(--bg-subtle)]/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Transform Requirements into Reality</h2>
              <p className="text-[var(--text-secondary)]">Works with your existing workflow. Import from Jira/Linear, enrich with code, export to anywhere.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[var(--border)] via-[var(--primary)]/20 to-[var(--border)] -z-10" />

              {/* Step 1: Import */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  🔗
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">1</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Import Issues</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Pull issues directly from <span className="font-medium">Jira or Linear</span> with automatic priority & type mapping.
                </p>
              </div>

              {/* Step 2: Enrich */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  🧠
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">2</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Deep Analysis</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  AI analyzes your codebase to generate API specs, test plans, and architectural insights automatically.
                </p>
              </div>

              {/* Step 3: Refine */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  ✨
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">3</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Clarify</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Answer smart clarification questions to finalize acceptance criteria and implementation details.
                </p>
              </div>

              {/* Step 4: Export */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-[var(--bg)] border border-[var(--border)] shadow-sm flex items-center justify-center text-3xl mb-6 relative z-10">
                  📤
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">4</div>
                </div>
                <h3 className="font-semibold text-lg mb-2">Execute</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Export to Jira, Linear, Markdown, or AEC.xml for AI agents. Your choice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need to Ship Fast</h2>
              <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                From bidirectional integrations to agent-ready specs, Forge automates the entire spec-to-execution pipeline.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: Deep Analysis */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Deep Code Analysis</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  We analyze your repo structure, tech stack, and existing patterns to generate technically accurate specs that respect your architecture.
                </p>
              </div>

              {/* Feature 2: API Detection */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart API Detection</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Automatically detect new endpoints, modifications to existing controllers, and generate accurate cURL commands for testing.
                </p>
              </div>

              {/* Feature 3: Agent Contracts */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Agent-Ready Artifacts</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Generate downloadable <code className="text-xs bg-[var(--bg-subtle)] px-1 py-0.5 rounded border border-[var(--border)]">AEC.xml</code> contracts optimized for AI coding agents to execute without hallucinations.
                </p>
              </div>

              {/* Feature 4: Rich Context */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Rich Context Input</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Upload PRDs, PDFs, wireframes, and design assets. We digest it all to ensure the generated spec matches your product vision.
                </p>
              </div>

              {/* Feature 5: Bidirectional Sync */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Bidirectional Import & Export</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Import issues from Jira or Linear, enrich them with AI analysis, then export specs back or create new tickets. Full cycle sync.
                </p>
              </div>

              {/* Feature 6: Quality Scoring */}
              <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--text-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Quality Metrics</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Get real-time quality scoring (0-100) based on spec completeness, clarity, technical accuracy, and test coverage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-[var(--text-secondary)]">Start for free, upgrade as you scale.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex flex-col">
                <h3 className="font-semibold text-xl mb-2">Hobby</h3>
                <div className="text-4xl font-bold mb-6">$0<span className="text-base font-normal text-[var(--text-secondary)]">/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">Perfect for side projects and experiments.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg border border-[var(--border)] text-center text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
                  Get Started
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>3 tickets / month</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Basic repo analysis</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Markdown exports</span>
                  </li>
                </ul>
              </div>

              {/* Pro Tier */}
              <div className="p-8 rounded-xl border border-[var(--primary)] bg-[var(--bg-subtle)] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[var(--primary)] text-[var(--primary-bg)] text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <h3 className="font-semibold text-xl mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-6">$12<span className="text-base font-normal text-[var(--text-secondary)]">/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">For professional developers shipping fast.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg bg-[var(--text)] text-[var(--bg)] text-center text-sm font-medium hover:opacity-90 transition-opacity">
                  Start Free Trial
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>30 tickets / month</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Deep Code Analysis</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Linear & Jira Integration</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>AEC XML Agent Contracts</span>
                  </li>
                </ul>
              </div>

              {/* Team Tier */}
              <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] flex flex-col">
                <h3 className="font-semibold text-xl mb-2">Team</h3>
                <div className="text-4xl font-bold mb-6">$59<span className="text-base font-normal text-[var(--text-secondary)]">/mo</span></div>
                <p className="text-[var(--text-secondary)] text-sm mb-8">For engineering teams demanding quality.</p>
                <Link href="/tickets" className="w-full py-2.5 rounded-lg border border-[var(--border)] text-center text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
                  Contact Sales
                </Link>
                <ul className="mt-8 space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Unlimited tickets</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Shared Team Workspace</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Role-Based Access</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="w-5 h-5 text-[var(--primary)]" />
                    <span>Priority Support</span>
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
              <span className="font-semibold text-base">Forge</span>
            </div>
          </div>
          <p>&copy; {new Date().getFullYear()} Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
