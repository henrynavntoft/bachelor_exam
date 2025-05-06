import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "./components/QueryProvider";
import AuthProvider from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import ClientOnly from "./components/ClientOnly";
import Header from "./components/Header";
import { Toaster } from "sonner";
import Footer from "./components/Footer";

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
                <main className="p-6 flex-grow">
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