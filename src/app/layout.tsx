import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-syne"
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plus-jakarta-sans"
});

export const metadata: Metadata = {
  title: "SideSpark",
  description: "Peer-to-peer marketplace for verified college students.",
  manifest: "/manifest.webmanifest",
  applicationName: "SideSpark"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0039A6"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${syne.variable} ${plusJakartaSans.variable} h-full overflow-hidden bg-[var(--color-surface)] text-[var(--color-text-primary)] antialiased`}
      >
        <ToastProvider>
          <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white shadow-phone ring-1 ring-black/5 md:rounded-[28px]">
            <div className="relative h-full w-full overflow-hidden">{children}</div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
