import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "Epson Internal Help Desk",
  description: "Internal help desk powered by AI for Epson manufacturing operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200">
          © {new Date().getFullYear()} Epson Internal Help Desk
        </footer>
      </body>
    </html>
  );
}
