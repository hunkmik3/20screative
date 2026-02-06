import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "20sCreative — Photographer and Filmmaker Portfolio",
  description:
    "20sCreative — Creative photographer and filmmaker specializing in fashion, beauty, and jewelry campaigns.",
  keywords: [
    "photographer",
    "filmmaker",
    "fashion photography",
    "beauty photography",
    "jewelry photography",
    "creative portfolio",
  ],
  openGraph: {
    title: "20sCreative — Photographer and Filmmaker Portfolio",
    description:
      "Creative photographer and filmmaker specializing in fashion, beauty, and jewelry campaigns.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
