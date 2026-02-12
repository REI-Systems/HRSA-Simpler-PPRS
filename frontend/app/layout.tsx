import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import SkipLink from './components/core/SkipLink/SkipLink';

export const metadata: Metadata = {
  title: 'PPRS - Community Platform',
  description: 'Community-driven platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <style>{`
          * {
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }
          @media (max-width: 768px) {
            html, body {
              overflow-x: hidden;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
