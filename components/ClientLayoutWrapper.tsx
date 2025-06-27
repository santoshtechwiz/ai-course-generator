"use client"

import { store } from "@/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import type React from "react"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
  session?: any
}

/**
 * Lightweight wrapper for client components that only need session and Redux
 * without the full layout provider stack. Use this for isolated components 
 * that need access to auth/store but don't need theming, queries, etc.
 */
export function ClientLayoutWrapper({ children, session }: ClientLayoutWrapperProps) {
  return (
    <SessionProvider session={session}>
      <Provider store={store}>
        {children}
      </Provider>
    </SessionProvider>
  );
}
