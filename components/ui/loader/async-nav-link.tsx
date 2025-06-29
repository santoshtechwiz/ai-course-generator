"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useLoader } from "./loader-context";
import type { LoaderProps } from "./types";

interface AsyncNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  loaderOptions?: Partial<LoaderProps>;
}

/**
 * A link component that shows the loader during navigation.
 * Use this for links that should show a loading state while the next page loads.
 */
export function AsyncNavLink({
  href,
  children,
  className,
  onClick,
  loaderOptions = {},
}: AsyncNavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showLoader, hideLoader } = useLoader();
  const isActive = pathname === href;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Default options
      const options: Partial<LoaderProps> = {
        variant: "clip",
        message: "Loading...",
        fullscreen: true,
        showProgress: false,
        ...loaderOptions,
      };

      // Show the loader
      showLoader(options);

      // Call any additional onClick handler
      if (onClick) onClick();

      // Navigate with a small delay to ensure the loader is visible
      setTimeout(() => {
        router.push(href);
      }, 50);
    },
    [href, router, showLoader, onClick, loaderOptions]
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </a>
  );
}
