import type { Metadata } from "next";
import { Fraunces, Outfit, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_LINE, SITE_NAME } from "@/lib/config";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Outfit({
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
    "Tag a Solana memecoin on X. Scan your profile. Get paid in that coin. Proof looks like a receipt.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
    >
      <body className="min-h-screen bg-night text-slip">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
