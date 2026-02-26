'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Rocket, Layers, Terminal, LifeBuoy } from 'lucide-react';
import { docsConfig, getPageHref } from '../_lib/docs-config';

const categoryIcons: Record<string, React.ReactNode> = {
  'getting-started': <Rocket className="w-4 h-4" />,
  'platform': <Layers className="w-4 h-4" />,
  'cli-and-mcp': <Terminal className="w-4 h-4" />,
  'troubleshooting': <LifeBuoy className="w-4 h-4" />,
};

export function DocsSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of docsConfig) {
      // Expand the category that contains the active page, or all by default on /docs
      const isActive = pathname === '/docs'
        ? cat.slug === 'getting-started'
        : cat.pages.some((p) => pathname === getPageHref(cat.slug, p.slug));
      initial[cat.slug] = isActive;
    }
    return initial;
  });

  const toggle = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <nav className="w-64 shrink-0 border-r border-[var(--border-subtle)] h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 px-4 hidden md:block">
      {docsConfig.map((category) => (
        <div key={category.slug} className="mb-1">
          <button
            onClick={() => toggle(category.slug)}
            className="flex items-center justify-between w-full py-2 px-2 rounded-md text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">{categoryIcons[category.slug]}</span>
              {category.title}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${expanded[category.slug] ? '' : '-rotate-90'}`}
            />
          </button>
          {expanded[category.slug] && (
            <div className="ml-4 border-l border-[var(--border-subtle)] pl-3 mb-3">
              {category.pages.map((page) => {
                const href = getPageHref(category.slug, page.slug);
                const isActive = pathname === href;
                return (
                  <Link
                    key={page.slug}
                    href={href}
                    className={`block py-1.5 px-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {page.title}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export function DocsMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-[var(--border-subtle)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-[var(--text)]"
      >
        <span>Navigation</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          {docsConfig.map((category) => (
            <div key={category.slug} className="mb-3">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 px-2">
                {category.title}
              </p>
              {category.pages.map((page) => {
                const href = getPageHref(category.slug, page.slug);
                const isActive = pathname === href;
                return (
                  <Link
                    key={page.slug}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block py-1.5 px-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-medium'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {page.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
