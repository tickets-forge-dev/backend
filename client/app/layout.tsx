import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthInitializer } from '@/src/components/AuthInitializer';
import { PostHogProvider } from '@/src/components/PostHogProvider';
import { DevStartupHealthCheck } from '@/core/components/dev/DevStartupHealthCheck';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Forge',
  description: 'Transform product intent into execution-ready tickets',
  icons: {
    icon: '/forge-icon.png',
    shortcut: '/forge-icon.png',
    apple: '/forge-icon.png',
  },
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
      <body className={`preload ${inter.variable} ${jetbrainsMono.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <PostHogProvider>
          <AuthInitializer />
          {process.env.NODE_ENV === 'development' && <DevStartupHealthCheck />}
          <div id="main-content">{children}</div>
          <Toaster position="bottom-right" richColors />
        </PostHogProvider>
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
