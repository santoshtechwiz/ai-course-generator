"use client";

import { ProgressProvider } from '@bprogress/next/app';
import { ReactNode } from 'react';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ProgressProvider
      height="4px"
      color="#0066cc"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;
