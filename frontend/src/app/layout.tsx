import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_LINE, SITE_NAME } from "@/lib/config";
import "./globals.css";

const display = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} · ${SITE_LINE}`,
  description:
    "Tag a Solana memecoin on X. Scan your profile. Get paid in that coin.",
  applicationName: "shillbag",
};

export const viewport: Viewport = {
  themeColor: "#f4f4f4",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-page text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
