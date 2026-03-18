import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] py-12 text-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-subtle)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <Image src="/forge-icon.png" alt="forge" width={24} height={24} />
            <span className="font-bold text-base bg-gradient-to-r from-[var(--primary)] to-orange-500 text-transparent bg-clip-text">forge</span>
          </div>
        </div>
        <p>&copy; {new Date().getFullYear()} forge. All rights reserved.</p>
      </div>
    </footer>
  );
}
