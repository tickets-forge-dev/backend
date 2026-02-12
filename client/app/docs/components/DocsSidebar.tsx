/* eslint-disable react/no-unescaped-entities */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docsNav } from '../lib/docs-nav';
import { Book } from 'lucide-react';

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64 lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:dark:border-gray-800 lg:bg-white lg:dark:bg-gray-950 lg:pt-20 lg:pb-10 lg:px-6">
      <nav className="space-y-8">
        {docsNav.map((section, i) => (
          <div key={i} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.disabled ? '#' : item.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium'
                          : item.disabled
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed pointer-events-none'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.label && (
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-100">
                            {item.label}
                          </span>
                        )}
                        {item.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
