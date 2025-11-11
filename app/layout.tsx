import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'Rentals Demo',
  description: 'Demo rental listings site (Next.js + Google Sheets)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10">
          <div className="container h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold">Rentals Demo</Link>
            <nav className="flex gap-4 text-sm">
              <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="border-t border-white/10 mt-12">
          <div className="container py-8 text-sm opacity-70">
            © {new Date().getFullYear()} Rentals Demo
          </div>
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
