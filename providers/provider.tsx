"use client";

import * as React from "react";
import { ThemeProviderProps } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, SessionProviderProps } from "next-auth/react";

const queryClient = new QueryClient();

interface ProvidersProps extends Omit<ThemeProviderProps, 'children'>, Omit<SessionProviderProps, 'children'> {
  children: React.ReactNode;
}

export function Providers({ children, session, ...props }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
