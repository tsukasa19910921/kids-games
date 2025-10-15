import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
    default: 'こどもしりとり｜声で遊ぶ・タイピングが学べる',
    template: '%s | こどもしりとり',
  },
  description: '声でしりとり、キーボードでタイピング練習。遊びながら語彙力とローマ字入力が身につく。広告なし・無料で安心。幼児〜小学生の情報教育に最適。',
  keywords: [
    'しりとり', '子供向けゲーム', '幼児', '小学生',
    'タイピング', 'ローマ字', 'キーボード',
    '音声認識', '親子', '言葉あそび', '知育', 'ひらがな', '語彙力',
    '情報教育', 'ICT教育', '無料', '広告なし'
  ],
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
    title: 'こどもしりとり｜声で遊ぶ・タイピングが学べる',
    description: '声でしりとり、キーボードでタイピング練習。広告なし・無料で安心。幼児〜小学生の語彙力とローマ字入力が育つ。',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'こどもしりとり - 声で遊ぶ・タイピングが学べる',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'こどもしりとり｜声で遊ぶ・タイピングが学べる',
    description: 'しりとりで遊びながら、タイピング練習とひらがな学習。無料・広告なし。',
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
  alternates: {
    canonical: '/',
  },
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
        {/* 構造化データ（JSON-LD） - Googleにアプリ情報を伝える */}
        <Script id="ld-webapp" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'こどもしりとり',
            applicationCategory: 'EducationalApplication',
            about: '音声認識としりとりで遊びながら、タイピング練習とひらがな学習ができる子供向け教育アプリ',
            operatingSystem: 'Web',
            inLanguage: 'ja',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'JPY',
            },
            isFamilyFriendly: true,
            educationalUse: ['タイピング練習', '語彙学習', 'ひらがな学習'],
            typicalAgeRange: '4-12',
            url: 'https://kids-games-jp.vercel.app',
            description: '親子で声とキーボードで楽しめる。語彙力とタイピングが育つしりとり。広告なし・無料。',
          })}
        </Script>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-22KSQYGQ88"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-22KSQYGQ88');
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}
