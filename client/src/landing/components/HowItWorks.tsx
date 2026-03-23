const STEPS: { number: string; title: string; subtitle: string; details?: string[]; color: string; borderColor: string; bgColor: string; dotColor: string }[] = [
  {
    number: '1',
    title: 'Describe',
    subtitle: 'What you want built',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/5',
    dotColor: 'bg-purple-400',
  },
  {
    number: '2',
    title: 'AI Refines',
    subtitle: 'Asks smart questions, fills gaps',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgColor: 'bg-violet-500/5',
    dotColor: 'bg-violet-400',
  },
  {
    number: '3',
    title: 'Approve',
    subtitle: 'Review the complete spec',
    details: ['Assigns developer automatically', 'Tracks wait time with SLA badges'],
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    dotColor: 'bg-amber-400',
  },
  {
    number: '4',
    title: 'Develop',
    subtitle: 'Developer builds from the spec',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    dotColor: 'bg-emerald-400',
  },
];

function ArrowIcon() {
  return (
    <svg className="w-5 h-5 text-[#333] shrink-0 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="w-5 h-5 text-[#333] shrink-0 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            From idea to development-ready spec in minutes — not days.
          </p>
        </div>

        {/* Desktop: horizontal flow / Mobile: vertical stack */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-3">
          {STEPS.map((step, i) => (
            <div key={step.number} className="contents">
              {/* Step card */}
              <div className={`w-full max-w-[240px] md:max-w-none md:flex-1 rounded-xl border ${step.borderColor} ${step.bgColor} p-5 text-center`}>
                <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${step.bgColor} border ${step.borderColor} ${step.color} text-xs font-bold mb-3`}>
                  {step.number}
                </div>
                <p className={`font-semibold text-[15px] mb-1 ${step.color}`}>{step.title}</p>
                <p className="text-[var(--text-secondary)] text-xs">{step.subtitle}</p>
                {step.details && (
                  <div className="mt-2.5 space-y-1">
                    {step.details.map((d) => (
                      <p key={d} className="text-[var(--text-tertiary)] text-[11px] flex items-center justify-center gap-1.5">
                        <span className={`${step.color} text-[10px]`}>✓</span> {d}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrow between steps */}
              {i < STEPS.length - 1 && (
                <>
                  <ArrowIcon />
                  <ArrowDownIcon />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
