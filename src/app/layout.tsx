import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Adam E Holbrook",
    template: "%s | Adam E Holbrook",
  },
  description: "Photography by Adam E Holbrook",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white" style={{ fontFamily: "'EB Garamond', serif" }}>
        <Sidebar />
        <MobileNav />
        <div className="lg:ml-52 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
