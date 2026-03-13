function ArrowDownIcon() {
  return (
    <svg className="w-5 h-5 text-[#525252]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
    </svg>
  );
}

function DesktopFlowDiagram() {
  return (
    <div className="hidden md:block">
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

        {/* PLANNING SIDE container */}
        <rect x="8" y="8" width="545" height="310" rx="16" fill="#7c3aed" fillOpacity="0.04" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
        <text x="24" y="32" fill="#a78bfa" fontSize="12" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">PLANNING SIDE</text>

        {/* DEV SIDE container */}
        <rect x="570" y="8" width="322" height="310" rx="16" fill="#3b82f6" fillOpacity="0.04" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
        <text x="586" y="32" fill="#60a5fa" fontSize="12" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">DEV SIDE</text>

        {/* ROW 1 arrows */}
        <line x1="230" y1="90" x2="300" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />
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

        {/* ROW 2 */}
        <line x1="715" y1="130" x2="715" y2="200" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />
        <path d="M 640 200 L 640 170 Q 640 160 650 160 L 780 160 Q 790 160 790 170 L 790 200" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" fill="none" markerEnd="url(#arrow-purple)" />
        <text x="715" y="155" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="system-ui">needs more context</text>

        {/* Node 4: PM Approves */}
        <rect x="600" y="200" width="230" height="80" rx="16" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="715" y="232" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">PM Approves</text>
        <text x="715" y="256" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Validates intent is preserved</text>
        <circle cx="812" cy="202" r="12" fill="#f59e0b" />
        <text x="812" y="206" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

        {/* ROW 3: AEC Forged */}
        <line x1="715" y1="280" x2="715" y2="340" stroke="#f59e0b" strokeWidth="2" />
        <line x1="715" y1="340" x2="560" y2="380" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
        <text x="660" y="338" fill="#f59e0b" fontSize="10" fontFamily="system-ui">approved</text>

        <rect x="240" y="375" width="340" height="95" rx="20" fill="url(#aec-glow)" />
        <rect x="250" y="380" width="320" height="85" rx="18" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
        <text x="410" y="412" textAnchor="middle" fill="#f59e0b" fontSize="18" fontWeight="700" fontFamily="system-ui">AEC Forged</text>
        <text x="410" y="434" textAnchor="middle" fill="#e4e4e7" fontSize="12" fontFamily="system-ui">Verified execution contract</text>
        <text x="410" y="452" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="system-ui">AC &middot; APIs &middot; Scope &middot; Tech Context</text>

        {/* ROW 4: Guided Prep */}
        <line x1="410" y1="465" x2="410" y2="510" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrow-cyan)" />
        <rect x="310" y="510" width="200" height="60" rx="14" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
        <text x="410" y="537" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Guided Prep</text>
        <text x="410" y="555" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Forgy asks the right questions</text>
        <circle cx="492" cy="512" r="12" fill="#06b6d4" />
        <text x="492" y="516" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>

        {/* ROW 5: Execute */}
        <line x1="410" y1="570" x2="410" y2="610" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
        <rect x="310" y="610" width="200" height="60" rx="14" fill="#18181b" stroke="#10b981" strokeWidth="2" />
        <text x="410" y="637" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Execute</text>
        <text x="410" y="657" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">AI implements the spec</text>
        <circle cx="492" cy="612" r="12" fill="#10b981" />
        <text x="492" y="616" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">CLI</text>
      </svg>
    </div>
  );
}

function MobileFlowDiagram() {
  return (
    <div className="md:hidden flex flex-col items-center gap-3">
      <div className="w-full max-w-[300px] rounded-xl border border-purple-500/25 border-dashed bg-purple-500/[0.04] px-4 py-2">
        <p className="text-purple-400 text-xs font-bold tracking-wide">PLANNING SIDE</p>
      </div>

      <div className="w-full max-w-[300px] rounded-2xl border border-purple-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
        <p className="font-semibold text-[15px] mb-1">PM Drafts Intent</p>
        <p className="text-[var(--text-secondary)] text-xs">The idea — what and why</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-violet-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-[10px]">AI</div>
        <p className="font-semibold text-[15px] mb-1">AI Asks Questions</p>
        <p className="text-[var(--text-secondary)] text-xs">Gap analysis before dev touches it</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-xl border border-blue-500/25 border-dashed bg-blue-500/[0.04] px-4 py-2">
        <p className="text-blue-400 text-xs font-bold tracking-wide">DEV SIDE</p>
      </div>

      <div className="w-full max-w-[300px] rounded-2xl border border-blue-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
        <p className="font-semibold text-[15px] mb-1">Dev-Refine</p>
        <p className="text-[var(--text-secondary)] text-xs">Enriches with code context</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-amber-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
        <p className="font-semibold text-[15px] mb-1">PM Approves</p>
        <p className="text-[var(--text-secondary)] text-xs">Validates intent is preserved</p>
        <p className="text-purple-400 text-[11px] mt-2">&#8635; needs more context? back to Dev-Refine</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border-2 border-amber-500 bg-[#18181b] p-6 text-center relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <p className="font-bold text-[18px] mb-1 text-amber-400">AEC Forged</p>
        <p className="text-[var(--text-secondary)] text-xs">Verified execution contract</p>
        <p className="text-[var(--text-tertiary)] text-[10px] mt-1">AC &middot; APIs &middot; Scope &middot; Tech Context</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-cyan-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
        <p className="font-semibold text-[15px] mb-1">Guided Prep</p>
        <p className="text-[var(--text-secondary)] text-xs">Forgy asks the right questions</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-green-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">CLI</div>
        <p className="font-semibold text-[15px] mb-1">Execute</p>
        <p className="text-[var(--text-secondary)] text-xs">AI implements the spec</p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-[var(--text-secondary)]">From messy idea to verified contract — through a forging pipeline.</p>
        </div>

        <div className="relative">
          <DesktopFlowDiagram />
          <MobileFlowDiagram />
        </div>
      </div>
    </section>
  );
}
