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
  title: "Solana Contribute — The Superteam Open Source Index",
  description: "High-density index of active repositories on Solana",
  keywords: [
    "Solana",
    "Open Source",
    "Blockchain",
    "Rust",
    "Web3",
    "Contribute",
    "Developer Tools",
    "Superteam",
    "Solana Foundation",
  ],
  authors: [{ name: "Superteam" }],
  openGraph: {
    title: "Solana Contribute — The Superteam Open Source Index",
    description: "High-density index of active repositories on Solana",
    type: "website",
    locale: "en_US",
    siteName: "Superteam Contribute",
    images: [
      {
        url: "/OG/OG.png",
        width: 1200,
        height: 630,
        alt: "Solana Contribute Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Contribute — The Superteam Open Source Index",
    description: "High-density index of active repositories on Solana",
    images: ["/OG/OG.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Solana Contribute",
              "url": "https://contribute.superteam",
              "description": "Discover high-impact open-source projects on Solana.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://contribute.superteam/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        <div className="gradient-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
