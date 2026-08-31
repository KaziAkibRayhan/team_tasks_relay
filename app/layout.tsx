import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const SITE_URL = 'https://relay-task-workspace-2026.swop-id.chatgpt.site';
const SOCIAL_IMAGE = `${SITE_URL}/og.png`;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Relay — Team work, clearly owned',
  description:
    'A focused team task system that surfaces urgent, overdue, and unassigned work.',
  applicationName: 'Relay',
  openGraph: {
    title: 'Relay — Team work, clearly owned',
    description:
      'A focused team task system that surfaces urgent, overdue, and unassigned work.',
    url: SITE_URL,
    siteName: 'Relay',
    type: 'website',
    images: [
      {
        url: SOCIAL_IMAGE,
        width: 1731,
        height: 909,
        alt: 'Relay — Team work, clearly owned',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relay — Team work, clearly owned',
    description:
      'A focused team task system that surfaces urgent, overdue, and unassigned work.',
    images: [SOCIAL_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
