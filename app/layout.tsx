import type { Metadata } from 'next';
import { Noto_Sans_TC, Space_Grotesk } from 'next/font/google';
import './globals.css';

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: 'CEEC Essay Assessment Standard',
  description: '學測英文作文極簡評量系統',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}