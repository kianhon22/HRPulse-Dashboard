import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { UserProfile } from "@/components/user-profile";
import { AuthProvider } from "@/contexts/auth-context";
import { MainContent } from "@/components/main-content";
import { Suspense } from 'react'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRPulse Dashboard",
  description: "HR Management Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
          {/* fallback={<div>Loading...</div>}> */}
            <Suspense>
              <div className="flex min-h-screen">
                <Sidebar />
                <MainContent>{children}</MainContent>
                <UserProfile />
              </div>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
