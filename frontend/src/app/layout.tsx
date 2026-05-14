import type { Metadata } from "next";
import { QueryClient, QueryClientProvider } from "react-query";
import "./globals.css";

export const metadata: Metadata = {
  title: "Epson Helpdesk Chatbot",
  description: "Smart Helpdesk Chatbot for PT Indonesia Epson Industry",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
