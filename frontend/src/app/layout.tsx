import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MicroAlpha Studio | AI Trading Command Centre by Salah Alioui",
  description: "Institutional AI trading intelligence, micro-cap growth screener, and simulated trading sandbox by Salah Alioui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-slate-100 antialiased min-h-screen selection:bg-accent-cyan selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
