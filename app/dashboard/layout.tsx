"use client";

import { ActivityProvider } from "@/app/providers/activityContext";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/app/providers/userContext";
import { ThemeProvider } from "../providers/theme-provider";
import Footer from "../components/shared/Footer";
import { GlobalLoading } from "../components/shared/GlobalLoading";
import Navbar from "../components/shared/Navbar";
import { Suspense } from "react";
import { TrackingProvider } from "../providers/TrackingProvider";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = useSession().data?.user?.id ?? ""; // Provide a default value

  return (
    <TrackingProvider userId={userId}>
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
                <div className="container mx-auto px-4 lg:px-4">
                  <Suspense fallback={<div>Loading...</div>}>
                    {children}
                  </Suspense>
                </div>
              </main>
              <Footer />
            </ActivityProvider>
          </div>
        </UserProvider>
      </ThemeProvider>
    </TrackingProvider>
  );
}