import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuraBackground from "./components/AuraBackground";
import TileGrid from "./components/TileGrid";
import OrbCursor from "./components/OrbCursor";
import CustomizeToolbar from "./components/CustomizeToolbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://m4ster-5in1.pages.dev";
const SITE_TITLE =
  "M4STER-5IN1 — Five Games, One App | Web, Windows, Mac, Android, iOS";
const SITE_DESC =
  "Play Snake, Connect 4, Memory Match, Tic-Tac-Toe, and Number Guessing. One codebase, identical on every platform. Free, offline, no accounts.";
const SITE_KEYWORDS = [
  "m4ster 5in1",
  "5in1 games",
  "browser games",
  "free online games",
  "snake game",
  "connect 4",
  "memory match",
  "tic tac toe",
  "number guessing",
  "free browser games",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: "M4STER-5IN1",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "M4STER-5IN1 — five games, one app, everywhere",
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
  robots: {
    index: true,
    follow: true,
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
        <OrbCursor />
        <CustomizeToolbar />
        {children}
      </body>
    </html>
  );
}
