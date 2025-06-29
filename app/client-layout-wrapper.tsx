"use client";

import React from "react";
import { LoaderProvider } from "@/components/ui/loader/loader-context"; // Adjust the import path if needed

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="client-layout-wrapper">
      <LoaderProvider>
        {children}
      </LoaderProvider>
    </div>
  );
}

export default ClientLayoutWrapper;
