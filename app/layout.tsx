import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amana Chat",
  description: "A modern real-time chat powered by Ably",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb", // blue-600
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased min-h-dvh bg-background text-foreground selection:bg-blue-200/50`}
      >
        {children}
      </body>
    </html>
  );
}
