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
  title: "Solana Contribute — The Ecosystem Open Source Index",
  description:
    "Discover high-impact open-source projects on Solana. We track top ecosystem developers' GitHub activity to find the best repositories for you to contribute to.",
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
  authors: [{ name: "Solana Ecosystem" }],
  openGraph: {
    title: "Solana Contribute — The Ecosystem Open Source Index",
    description: "Discover high-impact open-source projects on Solana. Tracked via AI-analyzed GitHub activity.",
    type: "website",
    locale: "en_US",
    siteName: "Solana Contribute",
    images: [
      {
        url: "/og-image.png", // Note: User needs to provide this or I can generate a placeholder
        width: 1200,
        height: 630,
        alt: "Solana Contribute Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solana Contribute — The Ecosystem Open Source Index",
    description: "Find your next contribution on Solana. AI-powered repository tracking.",
    images: ["/og-image.png"],
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
              "url": "https://contribute.solana.com",
              "description": "Discover high-impact open-source projects on Solana.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://contribute.solana.com/?search={search_term_string}",
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
