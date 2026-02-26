import Link from 'next/link';
import { Rocket, Layers, Terminal, LifeBuoy } from 'lucide-react';
import { docsConfig, getPageHref } from './_lib/docs-config';

const categoryIcons: Record<string, React.ReactNode> = {
  'getting-started': <Rocket className="w-5 h-5" />,
  'platform': <Layers className="w-5 h-5" />,
  'cli-and-mcp': <Terminal className="w-5 h-5" />,
  'troubleshooting': <LifeBuoy className="w-5 h-5" />,
};

export default function DocsIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-2">Documentation</p>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Welcome to Forge Docs</h1>
      <p className="text-[var(--text-secondary)] text-base mb-10 max-w-2xl">
        Everything you need to turn messy ideas into verified execution contracts — for PMs and developers.
      </p>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-16">
        <Link
          href="/docs/getting-started/what-is-forge"
          className="group rounded-lg border border-[var(--border-subtle)] p-5 hover:border-[var(--primary)]/40 transition-colors"
        >
          <Rocket className="w-6 h-6 text-[var(--text-secondary)] mb-3 group-hover:text-[var(--primary)] transition-colors" />
          <h3 className="text-sm font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors">Quick Start</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Learn what Forge is and get up and running</p>
        </Link>
        <Link
          href="/docs/cli-and-mcp/command-reference"
          className="group rounded-lg border border-[var(--border-subtle)] p-5 hover:border-[var(--primary)]/40 transition-colors"
        >
          <Terminal className="w-6 h-6 text-[var(--text-secondary)] mb-3 group-hover:text-[var(--primary)] transition-colors" />
          <h3 className="text-sm font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors">CLI Reference</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Every command, flag, and environment variable</p>
        </Link>
        <Link
          href="/docs/platform/aec"
          className="group rounded-lg border border-[var(--border-subtle)] p-5 hover:border-[var(--primary)]/40 transition-colors"
        >
          <Layers className="w-6 h-6 text-[var(--text-secondary)] mb-3 group-hover:text-[var(--primary)] transition-colors" />
          <h3 className="text-sm font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors">The AEC</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Understand the Agent Execution Contract</p>
        </Link>
      </div>

      {/* All pages by category */}
      {docsConfig.map((category) => (
        <section key={category.slug} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[var(--text-secondary)]">{categoryIcons[category.slug]}</span>
            <h2 className="text-lg font-semibold">{category.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {category.pages.map((page) => (
              <Link
                key={page.slug}
                href={getPageHref(category.slug, page.slug)}
                className="group flex items-start gap-3 rounded-lg px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:text-[var(--primary)] transition-colors">{page.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{page.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
