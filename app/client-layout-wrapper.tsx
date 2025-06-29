"use client";

import { GlobalLoadingHandler } from "@/components/ui/loader/global-loading-handler";

import { LoaderProvider, useLoader } from '@/components/ui/loader/loader-context';
export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider defaultOptions={{ variant: "pulse", fullscreen: true }}>
      <GlobalLoadingHandler />
      {children}
    </LoaderProvider>
  );
}

export default ClientLayoutWrapper;
