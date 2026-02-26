import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { docsConfig, findPage, getPageHref } from '../_lib/docs-config';
import { DocsMarkdown } from '../_components/DocsMarkdown';

function parseFrontmatter(content: string): { data: Record<string, string>; content: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };

  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  }
  return { data, content: match[2] };
}

function getDocsDir(): string {
  // In monorepo: client/ is cwd, docs are in ../backend/docs/forge-cli/
  const fromClient = path.resolve(process.cwd(), '..', 'backend', 'docs', 'forge-cli');
  if (fs.existsSync(fromClient)) return fromClient;
  // Fallback: cwd is repo root
  const fromRoot = path.resolve(process.cwd(), 'backend', 'docs', 'forge-cli');
  if (fs.existsSync(fromRoot)) return fromRoot;
  return fromClient;
}

function getAdjacentPages(categorySlug: string, pageSlug: string) {
  const allPages: { categorySlug: string; pageSlug: string; title: string; categoryTitle: string }[] = [];
  for (const cat of docsConfig) {
    for (const p of cat.pages) {
      allPages.push({ categorySlug: cat.slug, pageSlug: p.slug, title: p.title, categoryTitle: cat.title });
    }
  }
  const idx = allPages.findIndex((p) => p.categorySlug === categorySlug && p.pageSlug === pageSlug);
  return {
    prev: idx > 0 ? allPages[idx - 1] : null,
    next: idx < allPages.length - 1 ? allPages[idx + 1] : null,
  };
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug || slug.length !== 2) {
    notFound();
  }

  const [categorySlug, pageSlug] = slug;
  const found = findPage(categorySlug, pageSlug);

  if (!found) {
    notFound();
  }

  const docsDir = getDocsDir();
  const filePath = path.join(docsDir, categorySlug, `${pageSlug}.md`);

  let fileContent: string;
  try {
    fileContent = fs.readFileSync(filePath, 'utf-8');
  } catch {
    notFound();
  }

  const { data: frontmatter, content } = parseFrontmatter(fileContent);
  const { prev, next } = getAdjacentPages(categorySlug, pageSlug);

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-6">
        <Link href="/docs" className="hover:text-[var(--text)] transition-colors">Docs</Link>
        <span>/</span>
        <span className="text-[var(--primary)] uppercase font-semibold tracking-wider">
          {found.category.title}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        {frontmatter.title || found.page.title}
      </h1>
      {frontmatter.excerpt && (
        <p className="text-[var(--text-secondary)] text-base mb-8">{frontmatter.excerpt}</p>
      )}

      {/* Markdown content */}
      <DocsMarkdown content={content} />

      {/* Prev/Next navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-[var(--border-subtle)]">
        {prev ? (
          <Link
            href={getPageHref(prev.categorySlug, prev.pageSlug)}
            className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{prev.categoryTitle}</p>
              <p className="font-medium group-hover:text-[var(--primary)] transition-colors">{prev.title}</p>
            </div>
          </Link>
        ) : <div />}
        {next ? (
          <Link
            href={getPageHref(next.categorySlug, next.pageSlug)}
            className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors text-right"
          >
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{next.categoryTitle}</p>
              <p className="font-medium group-hover:text-[var(--primary)] transition-colors">{next.title}</p>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  const params: { slug: string[] }[] = [];
  for (const cat of docsConfig) {
    for (const page of cat.pages) {
      params.push({ slug: [cat.slug, page.slug] });
    }
  }
  return params;
}
