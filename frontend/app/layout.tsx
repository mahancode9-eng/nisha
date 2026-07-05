import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundaryWrapper } from "@/components/layout/ErrorBoundaryWrapper";
import { getThemeInitializerScript } from "@/lib/theme";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "نیشا",
    template: "%s | نیشا",
  },
  description: "فروشگاه‌ساز و پنل مدیریت برای فروشندگان، مشتری‌ها و تیم پشتیبانی.",
  applicationName: "نیشا",
  manifest: "/manifest.json",
  openGraph: {
    title: "نیشا",
    description: "فروشگاه‌ساز و پنل مدیریت برای فروشندگان، مشتری‌ها و تیم پشتیبانی.",
    type: "website",
    siteName: "نیشا",
  },
  twitter: {
    card: "summary_large_image",
    title: "نیشا",
    description: "فروشگاه‌ساز و پنل مدیریت برای فروشندگان، مشتری‌ها و تیم پشتیبانی.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "نیشا",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getThemeInitializerScript(),
          }}
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${vazirmatn.variable} min-h-screen bg-background text-foreground antialiased`}>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CustomerAuthProvider>
                <ToastProvider>
                  <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
                </ToastProvider>
              </CustomerAuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `,
            }}
          />
        )}
      </body>
    </html>
  );
}
