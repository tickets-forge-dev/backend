'use client';

const embers = [
  { size: 3, color: 'bg-orange-500/70', left: '8%', drift: 12, duration: 12, delay: 0 },
  { size: 2, color: 'bg-orange-400/50', left: '15%', drift: -8, duration: 11, delay: 3 },
  { size: 3, color: 'bg-orange-500/40', left: '22%', drift: 15, duration: 14, delay: 1.5 },
  { size: 2, color: 'bg-amber-400/60', left: '30%', drift: -10, duration: 13, delay: 5 },
  { size: 4, color: 'bg-orange-600/30', left: '35%', drift: 6, duration: 16, delay: 0.8 },
  { size: 2, color: 'bg-amber-500/50', left: '42%', drift: -14, duration: 11, delay: 4 },
  { size: 3, color: 'bg-orange-400/60', left: '48%', drift: 10, duration: 12, delay: 2 },
  { size: 2, color: 'bg-red-500/40', left: '55%', drift: -6, duration: 15, delay: 6 },
  { size: 3, color: 'bg-amber-400/50', left: '60%', drift: 8, duration: 11, delay: 0.5 },
  { size: 2, color: 'bg-orange-500/60', left: '67%', drift: -12, duration: 13, delay: 2.5 },
  { size: 4, color: 'bg-orange-400/30', left: '73%', drift: 14, duration: 17, delay: 1.5 },
  { size: 2, color: 'bg-amber-500/50', left: '78%', drift: -9, duration: 12, delay: 5.5 },
  { size: 3, color: 'bg-orange-500/40', left: '85%', drift: 7, duration: 13, delay: 3.5 },
  { size: 2, color: 'bg-red-400/35', left: '90%', drift: -11, duration: 15, delay: 1 },
  { size: 2, color: 'bg-orange-300/40', left: '4%', drift: 5, duration: 14, delay: 7 },
  { size: 3, color: 'bg-amber-500/35', left: '52%', drift: -7, duration: 15, delay: 2.5 },
  { size: 2, color: 'bg-orange-400/45', left: '95%', drift: 9, duration: 11, delay: 6.5 },
];

export function EmberSprinkles() {
  return (
    <div className="relative w-full h-0 overflow-visible pointer-events-none" aria-hidden="true">
      <div className="absolute bottom-0 left-0 right-0 h-[220px]">
        {embers.map((e, i) => (
          <div
            key={i}
            className={`absolute bottom-0 ${e.color}`}
            style={{
              width: `${e.size}px`,
              height: `${e.size}px`,
              left: e.left,
              imageRendering: 'pixelated' as const,
              animation: `ember-float-${i} ${e.duration}s ${e.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Inline keyframes — immune to browser animation speed overrides */}
      <style>{`
        ${embers.map((e, i) => `
          @keyframes ember-float-${i} {
            0% { transform: translateY(0) translateX(0); opacity: 0; }
            8% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { transform: translateY(-180px) translateX(${e.drift}px); opacity: 0; }
          }
        `).join('')}
      `}</style>
    </div>
  );
}
