import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '學測英文作文評量平台 | 依據 CEEC 官方規準評量',
  description: '依據 CEEC 學測英文作文評分規準，提供分項評分報告、逐句修正對照與高分標竿範文。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}