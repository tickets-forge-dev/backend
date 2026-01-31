import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forge',
  description: 'Transform product intent into execution-ready tickets',
};

export default function RootLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="preload">{children}</body>
    </html>
  );
}
