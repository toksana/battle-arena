import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Battle Arena — AI Decision Engine',
  description: 'Generative UI dilemma engine: stream structured comparisons and weigh them live.',
};

const RootLayout = ({ children }: LayoutProps<'/'>) => (
  <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
    <body className="flex min-h-full flex-col font-sans">
      {children}
      {/* Vercel Web Analytics: page views only, cookie-free; a no-op locally and outside Vercel. */}
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
