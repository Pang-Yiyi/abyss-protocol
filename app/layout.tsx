import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'One Jump — 一鍵跳躍',
  description: '點一下跳過障礙，挑戰你的最高分。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
