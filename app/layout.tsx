import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import './globals.css';
import { SITE_TITLE, DESCRIPTION } from '@/lib/pages/shared';

export const metadata: Metadata = {
  title: {
    default: `${SITE_TITLE} · Rentals`,
    template: `%s · ${SITE_TITLE}`,
  },
  description: DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] pt-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-fg font-bold text-xl uppercase tracking-wider no-underline">
            {SITE_TITLE}
          </Link>
          <Navigation />
        </header>
        <main className="max-w-[1100px] mx-auto px-[clamp(1rem,3vw,2rem)] py-8 pb-20">
          {children}
        </main>
        <footer className="text-center py-8 pb-12 text-muted">
          <small>Built with a modern edge-native stack</small>
        </footer>
      </body>
    </html>
  );
}

