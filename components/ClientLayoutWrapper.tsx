"use client"

import { store } from "@/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import type React from "react"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {


  return (
    <SessionProvider>
      <Provider store={store}>
        {children}
      </Provider>
    </SessionProvider>
  );
}
