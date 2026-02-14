import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingMenu from "@/components/FloatingMenu";
import PageTracker from "@/components/PageTracker";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BichilGlobus - Таны бизнесийг дэлхийд холбоно",
  description: "BichilGlobus нь таны бизнесийг олон улсын зах зээлд гаргахад туслах найдвартай түнш юм.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <LanguageProvider>
          <PageTracker />
          <Header />
          <main className="flex-1 w-full pt-20 lg:pt-24">
            {children}
          </main>
          <Footer />
          <FloatingMenu />
        </LanguageProvider>
      </body>
    </html>
  );
}
