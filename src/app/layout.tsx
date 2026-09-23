import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResearchCast — Paper to Interactive Podcast",
  description:
    "Transform research papers into an interactive AI podcast with Level-3 citation depth. Listen, pause, ask questions, and explore knowledge graphs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-[#FAF8F5] text-[#24211D] overflow-hidden antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF8F5]">
          {children}
        </main>
      </body>
    </html>
  );
}
