import type { Metadata } from 'next';
import { Noto_Sans_TC, Space_Grotesk } from 'next/font/google';
import './globals.css';

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'CEEC 學測英文作文智慧評量系統 | EdTech',
  description: '上傳題目、輸入作文，立即獲得符合 CEEC 評分邏輯的分項評分、修改建議與高分範文。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#FAFAF8] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB]/10 selection:text-[#2563EB]">
        {children}
      </body>
    </html>
  );
}