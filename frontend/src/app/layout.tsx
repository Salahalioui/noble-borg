import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Trading Command Centre | Multi-Asset Terminal",
  description: "Next-generation institutional trading intelligence and autonomous AI copilot dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased min-h-screen selection:bg-accent-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
