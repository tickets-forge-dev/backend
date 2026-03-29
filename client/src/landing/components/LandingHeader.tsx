'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

export function LandingHeader() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <header className="w-full sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3">
          <Image
            src="/forge-icon.png"
            alt="Forge Logo"
            width={32}
            height={32}
            className="drop-shadow-sm"
          />
          <span className="font-medium text-xl tracking-tight text-red-500">
            forge
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/docs"
            className="hidden sm:inline text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/tickets"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text)] px-4 text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90"
          >
            Go to App
          </Link>
        </div>
      </div>
      {/* Scroll-aware bottom border — fades in as user scrolls past hero */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-[var(--border-subtle)]"
        style={{ opacity: borderOpacity }}
      />
    </header>
  );
}
