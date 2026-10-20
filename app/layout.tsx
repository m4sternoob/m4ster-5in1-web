import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuraBackground from "./components/AuraBackground";
import TileGrid from "./components/TileGrid";
import OrbCursor from "./components/OrbCursor";
import CustomizeToolbar from "./components/CustomizeToolbar";
import BackToTop from "./components/BackToTop";
import PwaRegister from "./components/PwaRegister";
import AutoFullscreen from "./components/AutoFullscreen";
import OrientationGuard from "./components/OrientationGuard";
import AppShell from "./components/app/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://m4ster-5in1.vercel.app";
const SITE_TITLE =
  "M4ster-5IN1 — Five Games, One App | Play Free Browser Games";
const SITE_DESC =
  "Play 9 free browser games in one app — Snake, 2048, Memory Match, Minesweeper, Tic-Tac-Toe, Connect 4, Number Guessing, Snakes & Ladders and more. No downloads, no signup, 100% free.";
const SITE_KEYWORDS = [
  "free browser games",
  "play snake online",
  "2048 game",
  "memory match game",
  "minesweeper online",
  "tic tac toe online",
  "multi-game app",
  "free online games",
  "m4ster-5in1 games",
  "m4ster-5in1",
  "connect 4 online",
  "number guessing game",
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "M4ster-5IN1",
  alternateName: "m4ster M4ster-5IN1",
  url: SITE_URL,
  description: SITE_DESC,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "m4sternoob",
  },
  inLanguage: "en",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "m4sternoob" }],
  creator: "m4sternoob",
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: SITE_URL,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "M4ster-5IN1",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: "M4ster-5IN1",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "M4ster-5IN1 — five games, one app, everywhere",
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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0e14",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <div className="rotate-overlay" role="alert">
          <svg
            className="rotate-overlay-glyph"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M34.3 11.7 A16 16 0 1 0 39.8 26.8" />
            <path d="M35.6 30.2 L39.8 26.8 L44 30.2" />
            <rect x="18.5" y="11" width="11" height="24" rx="2.8" />
            <path d="M22.5 31.5h3" />
          </svg>
          <p className="rotate-overlay-title">Portrait only</p>
          <p className="rotate-overlay-text">
            M4ster-5IN1 is built for portrait — rotate your device to keep
            playing.
          </p>
          <div className="rgb-sep rotate-overlay-sep" aria-hidden="true" />
        </div>
        <AuraBackground />
        <TileGrid />
        <OrbCursor />
        <CustomizeToolbar />
        <BackToTop />
        <PwaRegister />
        <AutoFullscreen />
        <OrientationGuard />
        <div className="relative z-10 flex min-h-full flex-col">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
