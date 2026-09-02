import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dobby — Session Dwarf",
  description: "Shake your phone. Ruin a dwarf's day. Get an answer.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dobby" />
      </head>
      <body>{children}</body>
    </html>
  );
}
