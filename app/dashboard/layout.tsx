"use client";

import { ActivityProvider } from "@/app/providers/activityContext";
import { Toaster } from "@/components/ui/toaster";

import { UserProvider } from "@/app/providers/userContext";

import { ThemeProvider } from "../providers/theme-provider";
import Footer from "../components/shared/Footer";
import { GlobalLoading } from "../components/shared/GlobalLoading";
import Navbar from "../components/shared/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
    >
      <UserProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <ActivityProvider>
            <GlobalLoading />
            <main className="flex-1">
              <div className="container mx-auto px-4 lg:px-4 ">{children}</div>
            </main>
            <Footer />
            <Toaster />
          </ActivityProvider>
        </div>
      </UserProvider>
    </ThemeProvider>
  );
}

