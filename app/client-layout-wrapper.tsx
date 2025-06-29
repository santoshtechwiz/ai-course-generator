"use client";


import ProgressBarProvider from "@/components/ui/loader/ProgressBarProvider";


export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
   <ProgressBarProvider>
    
      {children}
    </ProgressBarProvider>
  );
}

export default ClientLayoutWrapper;
