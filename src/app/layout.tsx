import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LeadForge AI | Autonomous B2B Lead Intelligence & Outreach Engine",
  description: "Enrich high-intent B2B company leads, uncover pain points & tech stacks, and generate hyper-personalized multi-channel sales pitches in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#090d16] text-slate-100 min-h-screen selection:bg-indigo-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
