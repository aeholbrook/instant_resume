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
      <body className="font-sans min-h-screen bg-white">
        <Sidebar />
        <MobileNav />
        <div className="lg:ml-52 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
