import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./global.css";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Sari-Sari Store Management",
  description: "Sales, inventory, utang, and payments for your sari-sari store.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} font-sans antialiased bg-paper text-ink selection:bg-marigold-light dark:bg-dark-paper dark:text-dark-ink dark:selection:bg-dark-marigold-tint`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 md:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
