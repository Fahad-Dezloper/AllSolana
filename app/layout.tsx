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
  title: "Solana Open Source Tracker — Discover & Contribute",
  description:
    "Find the best open-source Solana projects to contribute to. Powered by AI analysis of ecosystem leaders' GitHub activity.",
  keywords: [
    "Solana",
    "open source",
    "contribute",
    "blockchain",
    "GitHub",
    "Superteam",
  ],
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
        <div className="gradient-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
