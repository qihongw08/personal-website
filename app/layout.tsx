import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Geist_Mono, Caveat } from "next/font/google";
import { profile } from "@/content/profile";
import { UnregisterServiceWorker } from "@/components/UnregisterServiceWorker";
import { GuohuaBackground } from "@/components/shared/GuohuaBackground";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name.en}`,
  description: profile.tagline,
  icons: {
    icon: "/logos/logo.png",
    shortcut: "/logos/logo.png",
    apple: "/logos/logo.png",
  },
  openGraph: {
    title: `${profile.name.en}`,
    description: profile.tagline,
    type: "website",
    images: [{ url: "/logos/logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <UnregisterServiceWorker />
        <GuohuaBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
