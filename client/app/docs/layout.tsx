/* eslint-disable react/no-unescaped-entities */

import { DocsSidebar } from './components/DocsSidebar';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata = {
  title: 'Documentation | Forge',
  description: 'Learn how to use Forge effectively - guides, tutorials, and knowledge base.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <DocsSidebar />

      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Documentation</h1>
            <Link href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12 max-w-4xl w-full mx-auto">
          <div className="prose dark:prose-invert max-w-none">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 Forge. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
