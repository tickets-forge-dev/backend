'use client';

interface ZoomToggleProps {
  isCardMode: boolean;
  onToggle: () => void;
}

export function ZoomToggle({ isCardMode, onToggle }: ZoomToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5"
      aria-label={isCardMode ? 'Switch to dot view' : 'Switch to card view'}
    >
      {/* Dot icon */}
      <div className={`w-[5px] h-[5px] rounded-full transition-colors ${
        !isCardMode ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-tertiary)]'
      }`} />
      {/* Track */}
      <div className="w-[24px] h-[13px] bg-[var(--bg-hover)] rounded-full relative transition-colors">
        <div className={`w-[9px] h-[9px] rounded-full bg-[var(--text-secondary)] absolute top-[2px] transition-all duration-200 ${
          isCardMode ? 'left-[13px]' : 'left-[2px]'
        }`} />
      </div>
      {/* Card icon */}
      <div className={`w-[7px] h-[5px] rounded-[1px] transition-colors ${
        isCardMode ? 'bg-[var(--text-secondary)]' : 'bg-[var(--text-tertiary)]'
      }`} />
    </button>
  );
}
