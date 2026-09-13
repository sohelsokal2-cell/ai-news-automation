import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_Bengali, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const hind = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "সংবাদচক্র | SongbadChakra",
    template: "%s | সংবাদচক্র",
  },
  description: "বাংলা সংবাদের এআই-চালিত যাচাই ও স্বয়ংক্রিয় প্রকাশনা প্ল্যাটফর্ম।",
  openGraph: {
    title: "সংবাদচক্র",
    description: "যাচাইকৃত বাংলা সংবাদ, রুল ইঞ্জিনে স্বয়ংক্রিয় প্রকাশ।",
    images: ["/images/og-cover.svg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${hind.className} ${serif.variable} antialiased`}>{children}</body>
    </html>
  );
}
