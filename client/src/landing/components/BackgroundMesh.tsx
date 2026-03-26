export function BackgroundMesh() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Glow opacities are intentionally lower than --glow-primary/--glow-accent tokens
          since this is a global background layer — subtler than per-section glows */}

      {/* Top — indigo glow (hero area) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Middle — emerald glow (showcase area) */}
      <div
        className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Bottom — mixed glow (CTA area) */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px]"
        style={{
          background:
            'radial-gradient(ellipse at 40% 100%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 60% 100%, rgba(16,185,129,0.05) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}
