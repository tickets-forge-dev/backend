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
      <svg viewBox="0 0 900 620" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
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
          <linearGradient id="aec-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* WEB APP container */}
        <rect x="8" y="8" width="545" height="290" rx="16" fill="#7c3aed" fillOpacity="0.04" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
        <text x="24" y="32" fill="#a78bfa" fontSize="11" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">WEB APP</text>

        {/* DEVELOPER TOOLS container */}
        <rect x="570" y="8" width="322" height="590" rx="16" fill="#3b82f6" fillOpacity="0.04" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="6 3" />
        <text x="586" y="32" fill="#60a5fa" fontSize="11" fontWeight="700" fontFamily="system-ui" letterSpacing="0.05em">DEVELOPER TOOLS (CLI / MCP)</text>

        {/* ROW 1 arrows */}
        <line x1="230" y1="90" x2="300" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />
        <line x1="530" y1="90" x2="600" y2="90" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

        {/* Node 1: Draft Intent */}
        <rect x="20" y="50" width="210" height="80" rx="16" fill="#18181b" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="125" y="82" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Draft Intent</text>
        <text x="125" y="106" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">e.g. &quot;Add Stripe integration&quot;</text>
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
        <text x="812" y="56" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">MCP</text>

        {/* ROW 2 */}
        <line x1="715" y1="130" x2="715" y2="200" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />
        <path d="M 640 200 L 640 170 Q 640 160 650 160 L 780 160 Q 790 160 790 170 L 790 200" stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" fill="none" markerEnd="url(#arrow-purple)" />
        <text x="715" y="155" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="system-ui">needs more context</text>

        {/* Node 4: Review & Approve — straddles both containers */}
        <rect x="250" y="200" width="290" height="80" rx="16" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
        <text x="395" y="232" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Review &amp; Approve</text>
        <text x="395" y="256" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">Validates intent is preserved</text>
        <circle cx="522" cy="202" r="12" fill="#f59e0b" />
        <text x="522" y="206" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">Web</text>

        {/* Arrow from Dev-Refine down to Review */}
        <line x1="715" y1="200" x2="540" y2="230" stroke="#525252" strokeWidth="2" markerEnd="url(#arrow-gray)" />

        {/* ROW 3: Ticket Ready */}
        <line x1="395" y1="280" x2="395" y2="330" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
        <text x="430" y="315" fill="#f59e0b" fontSize="10" fontFamily="system-ui">approved</text>

        <rect x="220" y="355" width="370" height="95" rx="20" fill="url(#aec-glow)" />
        <rect x="230" y="360" width="350" height="85" rx="18" fill="#18181b" stroke="#f59e0b" strokeWidth="2.5" />
        <text x="405" y="392" textAnchor="middle" fill="#f59e0b" fontSize="18" fontWeight="700" fontFamily="system-ui">Ticket Ready</text>
        <text x="405" y="414" textAnchor="middle" fill="#e4e4e7" fontSize="12" fontFamily="system-ui">Complete, development-ready</text>
        <text x="405" y="432" textAnchor="middle" fill="#a1a1aa" fontSize="10" fontFamily="system-ui">AC &middot; APIs &middot; Scope &middot; Tech Context</text>

        {/* Email notification indicator */}
        <rect x="600" y="375" width="130" height="36" rx="10" fill="#18181b" stroke="#a78bfa" strokeWidth="1" strokeDasharray="4 2" />
        <text x="628" y="398" fill="#a78bfa" fontSize="14" fontFamily="system-ui">&#9993;</text>
        <text x="645" y="398" fill="#c4b5fd" fontSize="10" fontFamily="system-ui">Email notified</text>
        <line x1="580" y1="400" x2="600" y2="396" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 2" />

        {/* ROW 4: Develop */}
        <line x1="405" y1="445" x2="715" y2="500" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
        <rect x="615" y="500" width="200" height="60" rx="14" fill="#18181b" stroke="#10b981" strokeWidth="2" />
        <text x="715" y="527" textAnchor="middle" fill="#e4e4e7" fontSize="15" fontWeight="600" fontFamily="system-ui">Develop</text>
        <text x="715" y="547" textAnchor="middle" fill="#a1a1aa" fontSize="11" fontFamily="system-ui">AI builds it from the spec</text>
        <circle cx="797" cy="502" r="12" fill="#10b981" />
        <text x="797" y="506" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">MCP</text>
      </svg>
    </div>
  );
}

function MobileFlowDiagram() {
  return (
    <div className="md:hidden flex flex-col items-center gap-3">
      <div className="w-full max-w-[300px] rounded-xl border border-purple-500/25 border-dashed bg-purple-500/[0.04] px-4 py-2">
        <p className="text-purple-400 text-xs font-bold tracking-wide">WEB APP</p>
      </div>

      <div className="w-full max-w-[300px] rounded-2xl border border-purple-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
        <p className="font-semibold text-[15px] mb-1">Draft Intent</p>
        <p className="text-[var(--text-secondary)] text-xs">e.g. &quot;Add Stripe integration&quot;</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-violet-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-[10px]">AI</div>
        <p className="font-semibold text-[15px] mb-1">AI Asks Questions</p>
        <p className="text-[var(--text-secondary)] text-xs">Gap analysis before dev touches it</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-xl border border-blue-500/25 border-dashed bg-blue-500/[0.04] px-4 py-2">
        <p className="text-blue-400 text-xs font-bold tracking-wide">DEVELOPER TOOLS (CLI / MCP)</p>
      </div>

      <div className="w-full max-w-[300px] rounded-2xl border border-blue-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">MCP</div>
        <p className="font-semibold text-[15px] mb-1">Dev-Refine</p>
        <p className="text-[var(--text-secondary)] text-xs">Enriches with code context</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-amber-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">Web</div>
        <p className="font-semibold text-[15px] mb-1">Review &amp; Approve</p>
        <p className="text-[var(--text-secondary)] text-xs">Validates intent is preserved</p>
        <p className="text-purple-400 text-[11px] mt-2">&#8635; needs more context? back to Dev-Refine</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border-2 border-amber-500 bg-[#18181b] p-6 text-center relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <p className="font-bold text-[18px] mb-1 text-amber-400">Ticket Ready</p>
        <p className="text-[var(--text-secondary)] text-xs">Complete, development-ready</p>
        <p className="text-[var(--text-tertiary)] text-[10px] mt-1">AC &middot; APIs &middot; Scope &middot; Tech Context</p>
      </div>

      <div className="w-full max-w-[300px] rounded-xl border border-purple-400/25 border-dashed bg-purple-400/[0.04] px-4 py-2 text-center">
        <p className="text-purple-300 text-xs">&#9993; Developer notified via email</p>
      </div>
      <ArrowDownIcon />

      <div className="w-full max-w-[300px] rounded-2xl border border-green-500/50 bg-[#18181b] p-5 text-center relative">
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-[10px]">MCP</div>
        <p className="font-semibold text-[15px] mb-1">Develop</p>
        <p className="text-[var(--text-secondary)] text-xs">AI builds it from the spec</p>
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
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">Define the intent in the web app. Developers enrich it with real code context. Forge connects both — and what comes out is a complete, trusted spec.</p>
        </div>

        <div className="relative">
          <DesktopFlowDiagram />
          <MobileFlowDiagram />
        </div>
      </div>
    </section>
  );
}
