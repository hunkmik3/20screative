import type { Metadata } from "next";
import { EB_Garamond, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteTransitionLoader from "@/components/RouteTransitionLoader";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "20sCreative — Creative Production",
  description:
    "20sCreative — Creative production studio specializing in fashion, beauty, and jewelry campaigns.",
  keywords: [
    "creative production",
    "production studio",
    "fashion photography",
    "beauty photography",
    "jewelry photography",
    "creative portfolio",
  ],
  icons: {
    icon: "/logo-white.png",
    apple: "/logo-white.png",
  },
  openGraph: {
    title: "20sCreative — Creative Production",
    description:
      "Creative production studio specializing in fashion, beauty, and jewelry campaigns.",
    type: "website",
    locale: "en_US",
  },
};

const resetScrollOnReloadScript = `
(() => {
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    scrollToTop();
    window.addEventListener("pageshow", scrollToTop);
    window.addEventListener("beforeunload", scrollToTop);
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ebGaramond.variable} ${nunitoSans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script
          id="reset-scroll-on-reload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: resetScrollOnReloadScript }}
        />
        <RouteTransitionLoader />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
