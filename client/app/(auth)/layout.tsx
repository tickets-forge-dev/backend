export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand & Visual (35%) */}
      <div className="hidden lg:flex lg:w-[35%] relative overflow-hidden bg-[#0a0a0a] flex-col items-center justify-center p-12">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
              animation: 'float 10s ease-in-out infinite reverse',
            }}
          />
          <div
            className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
              animation: 'float 12s ease-in-out infinite 2s',
            }}
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
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/forge-icon.png"
              alt="Forge"
              width={140}
              height={140}
              className="drop-shadow-2xl"
            />
          </div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight">
            Forge
          </h1>
          <p className="text-[14px] text-[#a1a1aa] mt-3 max-w-[280px] leading-relaxed">
            Transform product intent into execution-ready engineering tickets
          </p>
        </div>

        {/* Bottom attribution */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[11px] text-[#52525b]">
            Built for engineering teams
          </p>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(10px, -20px) scale(1.05); }
            66% { transform: translate(-10px, 10px) scale(0.95); }
          }
        `}</style>
      </div>

      {/* Right Panel - Login (65%) */}
      <div className="flex-1 lg:w-[65%] flex items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
