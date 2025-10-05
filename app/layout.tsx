import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kids-games-jp.vercel.app'),
  title: {
    default: 'こどもしりとり - 音声で遊ぶしりとりゲーム',
    template: '%s | こどもしりとり',
  },
  description: '音声認識でしりとりが楽しめる子供向けWebアプリ。マイクで話すだけでコンピュータと対戦できます。Next.js 15 + Web Speech APIで実装。',
  keywords: ['しりとり', '子供向けゲーム', '音声認識', 'Web Speech API', 'Next.js', 'TypeScript', '教育アプリ'],
  authors: [{ name: 'tsukasa19910921' }],
  creator: 'tsukasa19910921',
  publisher: 'tsukasa19910921',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://kids-games-jp.vercel.app',
    siteName: 'こどもしりとり',
    title: 'こどもしりとり - 音声で遊ぶしりとりゲーム',
    description: '音声認識でしりとりが楽しめる子供向けWebアプリ。マイクで話すだけでコンピュータと対戦できます。',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'こどもしりとり',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'こどもしりとり - 音声で遊ぶしりとりゲーム',
    description: '音声認識でしりとりが楽しめる子供向けWebアプリ。マイクで話すだけでコンピュータと対戦できます。',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/icon.png',
    shortcut: '/images/icon.png',
    apple: '/images/icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
