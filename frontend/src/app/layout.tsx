import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./components/global/QueryProvider";
import AuthProvider from "./components/global/AuthProvider";
import { ThemeProvider } from "./components/global/ThemeProvider";
import ClientOnly from "./components/global/ClientOnly";
import Header from "./components/global/Header";
import { Toaster } from "sonner";
import Footer from "./components/global/Footer";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meet & Greet | Culture Connect",
  description: "A platform for meeting new people",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-7SGXZXJ94Q" strategy="afterInteractive" />
        <Script src="/gtag.js" strategy="afterInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <QueryProvider>
          <AuthProvider>

            <ClientOnly>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Header />
                <main className="p-6 flex-grow mb-4 min-h-screen">

                  {children}

                </main>
                <Footer />
                <Toaster />
              </ThemeProvider>
            </ClientOnly>

          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}