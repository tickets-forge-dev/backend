import type { Metadata } from 'next';
import Script from 'next/script';
import { AuthInitializer } from '@/src/components/AuthInitializer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forge',
  description: 'Transform product intent into execution-ready tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Initialize theme before render to avoid flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              const theme = localStorage.getItem('forge-theme') || 'system';
              const actualTheme = theme === 'system'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                : theme;
              document.documentElement.setAttribute('data-theme', actualTheme);
            })();
          `}
        </Script>
      </head>
      <body className="preload">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthInitializer />
        <div id="main-content">{children}</div>
        <Script id="remove-preload" strategy="afterInteractive">
          {`
            window.addEventListener('load', function() {
              setTimeout(function() {
                document.body.classList.remove('preload');
              }, 100);
            });
          `}
        </Script>
      </body>
    </html>
  );
}
