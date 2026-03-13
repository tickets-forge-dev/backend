const embers = [
  { size: 3, color: 'bg-orange-500/70', left: '8%', drift: '12px', duration: '3.2s', delay: '0s', slow: false },
  { size: 2, color: 'bg-orange-400/50', left: '15%', drift: '-8px', duration: '2.8s', delay: '1.4s', slow: false },
  { size: 3, color: 'bg-orange-500/40', left: '22%', drift: '15px', duration: '4.0s', delay: '0.6s', slow: true },
  { size: 2, color: 'bg-amber-400/60', left: '30%', drift: '-10px', duration: '3.5s', delay: '2.1s', slow: false },
  { size: 4, color: 'bg-orange-600/30', left: '35%', drift: '6px', duration: '4.5s', delay: '0.3s', slow: true },
  { size: 2, color: 'bg-amber-500/50', left: '42%', drift: '-14px', duration: '3.0s', delay: '1.8s', slow: false },
  { size: 3, color: 'bg-orange-400/60', left: '48%', drift: '10px', duration: '3.3s', delay: '0.9s', slow: false },
  { size: 2, color: 'bg-red-500/40', left: '55%', drift: '-6px', duration: '4.2s', delay: '2.5s', slow: true },
  { size: 3, color: 'bg-amber-400/50', left: '60%', drift: '8px', duration: '2.9s', delay: '0.2s', slow: false },
  { size: 2, color: 'bg-orange-500/60', left: '67%', drift: '-12px', duration: '3.6s', delay: '1.1s', slow: false },
  { size: 4, color: 'bg-orange-400/30', left: '73%', drift: '14px', duration: '4.8s', delay: '0.7s', slow: true },
  { size: 2, color: 'bg-amber-500/50', left: '78%', drift: '-9px', duration: '3.1s', delay: '2.3s', slow: false },
  { size: 3, color: 'bg-orange-500/40', left: '85%', drift: '7px', duration: '3.4s', delay: '1.6s', slow: false },
  { size: 2, color: 'bg-red-400/35', left: '90%', drift: '-11px', duration: '4.3s', delay: '0.5s', slow: true },
  { size: 2, color: 'bg-orange-300/40', left: '4%', drift: '5px', duration: '3.7s', delay: '3.0s', slow: false },
  { size: 3, color: 'bg-amber-500/35', left: '52%', drift: '-7px', duration: '4.1s', delay: '1.0s', slow: true },
  { size: 2, color: 'bg-orange-400/45', left: '95%', drift: '9px', duration: '3.0s', delay: '2.8s', slow: false },
];

export function EmberSprinkles() {
  return (
    <div className="relative w-full h-0 overflow-visible pointer-events-none" aria-hidden="true">
      <div className="absolute bottom-0 left-0 right-0 h-[140px]">
        {embers.map((e, i) => (
          <div
            key={i}
            className={`${e.slow ? 'ember-particle-slow' : 'ember-particle'} ${e.color}`}
            style={{
              width: `${e.size}px`,
              height: `${e.size}px`,
              left: e.left,
              '--ember-drift': e.drift,
              '--ember-duration': e.duration,
              '--ember-delay': e.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
