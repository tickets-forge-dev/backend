import { ForgeBrand } from '@/core/components/ForgeBrand';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand & Visual (35%) */}
      <div className="hidden lg:flex lg:w-[35%] relative overflow-hidden bg-[#0a0a0a] flex-col items-center justify-center p-12">
        {/* Static gradient orbs — soft ambient glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-[30%] -left-[15%] w-[70%] h-[70%] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)' }}
          />
          <div
            className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-[25%] right-[5%] w-[45%] h-[45%] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 65%)' }}
          />
          <div
            className="absolute top-[40%] left-[20%] w-[50%] h-[50%] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #f97316 0%, #f59e0b 30%, transparent 65%)' }}
          />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10 text-center max-w-[320px]">
          <div className="flex justify-center mb-6">
            <img
              src="/forge-icon.png"
              alt="forge"
              width={120}
              height={120}
              className="drop-shadow-2xl"
            />
          </div>
          <h1>
            <ForgeBrand size="lg" className="text-white" />
          </h1>
          <p className="text-lg text-[#e4e4e7] mt-3 font-medium leading-snug">
            Tickets PMs love.
            <br />
            That devs actually understand.
          </p>
          <p className="text-sm text-[#71717a] mt-2 leading-relaxed">
            PMs miss technical context. Forge doesn&apos;t.
          </p>

          {/* Flow steps */}
          <div className="mt-10 space-y-3 text-left">
            {[
              { step: 'Describe', detail: 'What you want built', color: 'bg-purple-400' },
              { step: 'AI Refines', detail: 'Fills gaps with code context', color: 'bg-violet-400' },
              { step: 'Approve', detail: 'PM and developer both sign off', color: 'bg-amber-400' },
              { step: 'Develop', detail: 'Build from the spec, not guesswork', color: 'bg-emerald-400' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${s.color} shrink-0`} />
                <span className="text-[13px] text-[#a1a1aa]">
                  <span className="text-[#e4e4e7] font-medium">{s.step}</span>
                  {' — '}{s.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* No CSS animations — static orbs avoid Linux/Chrome GPU timing bugs */}
      </div>

      {/* Right Panel - Login/Onboarding (65%) - ALWAYS DARK */}
      <div className="flex-1 lg:w-[65%] flex items-center justify-center bg-[#0a0a0a] p-6">
        <div className="w-full max-w-[400px] text-white">
          {children}
        </div>
      </div>
    </div>
  );
}
