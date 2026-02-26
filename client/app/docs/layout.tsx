import Image from 'next/image';
import Link from 'next/link';
import { DocsSidebar, DocsMobileNav } from './_components/DocsSidebar';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-bg)]">
      {/* Header */}
      <header className="w-full border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg)]/80 backdrop-blur-md z-50">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/forge-icon.png"
                alt="Forge Logo"
                width={28}
                height={28}
                className="drop-shadow-sm"
              />
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-[var(--primary)] to-orange-500 text-transparent bg-clip-text">Forge</span>
            </Link>
            <span className="text-[var(--border-subtle)]">|</span>
            <Link href="/docs" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/tickets"
              className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-[var(--text)] px-4 text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90"
            >
              Go to App
            </Link>
          </div>
        </div>
      </header>

      <DocsMobileNav />

      <div className="flex flex-1">
        <DocsSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
