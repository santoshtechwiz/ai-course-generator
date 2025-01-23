"use client";


import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/app/providers/userContext";
import { ThemeProvider } from "../providers/theme-provider";
import Footer from "../components/shared/Footer";
import { GlobalLoading, LoadingProvider } from "../components/shared/GlobalLoading";
import Navbar from "../components/shared/Navbar";
import { Suspense } from "react";
import { TrackingProvider } from "../providers/TrackingProvider";
import { useSession } from "next-auth/react";
import { DebugUserInfo } from "../components/DebugUserInfo";
import { Providers } from "../providers/provider";
import { SubscriptionProvider } from "@/hooks/useSubscription";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = useSession().data?.user?.id ?? "";

  return (
    <Providers>
       <LoadingProvider>
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
         
            <GlobalLoading />
           
            <SubscriptionProvider>
            <main className="flex-1">
              <div className="container mx-auto px-4 lg:px-4">
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
                <div className="fixed bottom-4 right-4 z-50">
                  <DebugUserInfo />
                </div>
              </div>
            </main>
            </SubscriptionProvider>
           
            <Footer />
            <Toaster />
          </div>
        </UserProvider>
      </ThemeProvider>
    </TrackingProvider>
    </LoadingProvider>
    </Providers>
  );
}