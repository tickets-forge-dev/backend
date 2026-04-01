/**
 * Detect if a project is a web project that can be previewed in WebContainer.
 * Checks tech stack from project profile for web frameworks/libraries.
 */

const WEB_TECH = new Set([
  'react', 'next', 'nextjs', 'next.js',
  'vue', 'nuxt', 'nuxtjs', 'nuxt.js',
  'angular', 'svelte', 'sveltekit',
  'astro', 'remix', 'gatsby',
  'vite', 'webpack',
  'html', 'css',
  'tailwind', 'tailwindcss',
]);

export function isWebProject(techStack: string[] | undefined | null): boolean {
  if (!techStack || techStack.length === 0) return false;
  return techStack.some((tech) => WEB_TECH.has(tech.toLowerCase()));
}
