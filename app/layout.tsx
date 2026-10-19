import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuraBackground from "./components/AuraBackground";
import TileGrid from "./components/TileGrid";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://m4ster-5in1.vercel.app";
const SITE_TITLE = "5IN1 — Five Games, One App, Everywhere";
const SITE_DESC =
  "Snake, Connect 4, Memory Match, Tic-Tac-Toe, and Number Guessing — playable on web, Windows, macOS, Android, and iOS. One codebase, one-to-one identical everywhere.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: "5IN1",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "5IN1 — five games, one app, everywhere",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuraBackground />
        <TileGrid />
        {children}
      </body>
    </html>
  );
}
