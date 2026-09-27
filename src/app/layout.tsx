import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kelas Affiliate AI — Raya Digital",
  description: "Dashboard pembelajaran internal Raya Digital untuk materi Faceless Affiliate AI",
};

import { ProgressProvider } from "@/context/ProgressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CurriculumProvider } from "@/context/CurriculumContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#F8F8F6] text-[#06152E]">
        <AuthProvider>
          <CurriculumProvider>
            <ProgressProvider>{children}</ProgressProvider>
          </CurriculumProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
