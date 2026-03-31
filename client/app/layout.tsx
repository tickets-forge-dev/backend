import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono, DM_Sans, Space_Grotesk, Sora, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthInitializer } from '@/src/components/AuthInitializer';
import { PostHogProvider } from '@/src/components/PostHogProvider';
import { DevStartupHealthCheck } from '@/core/components/dev/DevStartupHealthCheck';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'forge',
  description: 'Stop shipping half-baked tickets. forge turns rough ideas into complete, development-ready tickets.',
  manifest: '/manifest.json',
  icons: {
    icon: '/forge-icon.png',
    shortcut: '/forge-icon.png',
    apple: '/forge-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
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
        <Script id="font-init" strategy="beforeInteractive">
          {`
            (function() {
              var fonts = {
                inter: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
                'dm-sans': 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, sans-serif',
                'space-grotesk': 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, sans-serif',
                sora: 'var(--font-sora), -apple-system, BlinkMacSystemFont, sans-serif',
                'plus-jakarta': 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif',
                system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
                mono: 'var(--font-jetbrains), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
              };
              var saved = localStorage.getItem('forge-font');
              if (saved && fonts[saved]) {
                document.documentElement.style.setProperty('--font-sans', fonts[saved]);
                document.addEventListener('DOMContentLoaded', function() {
                  document.body.style.fontFamily = fonts[saved];
                });
              }
            })();
          `}
        </Script>
      </head>
      <body className={`preload ${inter.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${sora.variable} ${plusJakarta.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <PostHogProvider>
          <AuthInitializer />
          {process.env.NODE_ENV === 'development' && <DevStartupHealthCheck />}
          <div id="main-content">{children}</div>
          <Toaster position="bottom-right" richColors />
        </PostHogProvider>
        <Analytics />
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
