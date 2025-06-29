"use client";

import { LoaderProvider } from "@/components/ui/loader-context";


export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LoaderProvider >
  
      {children}
    </LoaderProvider>
  );
}

export default ClientLayoutWrapper;
