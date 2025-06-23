"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useLoader as useEnhancedLoader } from '@/components/ui/loader/loader-context';
import type { EnhancedLoaderProps } from './enhanced-loader';

interface AsyncNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  loaderOptions?: {
    variant?: "shimmer" | "pulse" | "progress" | "dots" | "glow";
    message?: string;
    subMessage?: string;
    showProgress?: boolean;
    fullscreen?: boolean;
  };
}

/**
 * A link component that shows the enhanced loader during navigation.
 * Use this for links that should show a loading state while the next page loads.
 */
export function AsyncNavLink({ 
  href, 
  children, 
  className, 
  onClick,
  loaderOptions = {}
}: AsyncNavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader, hideLoader } = useEnhancedLoader();
  const isActive = pathname === href;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
  // Default options
    const options: Partial<EnhancedLoaderProps> = {
      variant: "shimmer",
      message: "Loading...",
      fullscreen: true,
      showProgress: false,
      ...loaderOptions
    };
    
    // Show the loader
    showLoader(options);
    
    // Call any additional onClick handler
    if (onClick) onClick();
    
    // Navigate with a small delay to ensure the loader is visible
    setTimeout(() => {
      router.push(href);
    }, 50);
    
    // Hide the loader after navigation completes or times out
    setTimeout(() => {
      hideLoader();
    }, 1000); // Provide a maximum loading time
  }, [router, href, showLoader, hideLoader, onClick, loaderOptions]);

  return (
    <a 
      href={href} 
      onClick={handleClick}
      className={className}
      data-active={isActive} 
    >
      {children}
    </a>
  );
}

export default AsyncNavLink;
