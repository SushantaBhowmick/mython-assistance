import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SupabaseAuthProvider } from "@/components/auth/SupabaseAuthProvider";
import { CommandPaletteProvider } from "@/components/shell/CommandPaletteProvider";
import { GlobalPlayerProvider } from "@/components/player/GlobalPlayerProvider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mython",
    template: "%s · Mython",
  },
  description: "Your personal assistant — music, daily tools, and more.",
  applicationName: "Mython",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mython",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};
console.log("Version 1.0.5")
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col safe-top safe-bottom">
        <ThemeProvider>
          <PWAProvider>
            <SupabaseAuthProvider>
              <CommandPaletteProvider>
                <GlobalPlayerProvider>{children}</GlobalPlayerProvider>
              </CommandPaletteProvider>
            </SupabaseAuthProvider>
          </PWAProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
