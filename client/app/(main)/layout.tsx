import { ThemeToggle } from '@/core/components/ThemeToggle';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Minimal header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[var(--content-max)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-[var(--text-lg)] font-medium text-[var(--text)]">
                Forge
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content - centered max-width, no sidebar */}
      <main className="mx-auto max-w-[var(--content-max)] px-6 py-12">
        {children}
      </main>
    </div>
  );
}
