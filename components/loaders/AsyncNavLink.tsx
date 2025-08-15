"use client";
import React from "react";
import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/store/loaders/global-loader";

interface AsyncNavLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  [key: string]: any;
}

export function AsyncNavLink({
  children,
  href,
  className = "",
  prefetch = true,
  ...props
}: AsyncNavLinkProps) {
  const router = useRouter();
  const { startLoading } = useGlobalLoader();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.onClick) props.onClick(e);
    if (e.defaultPrevented) return;

    startLoading({
      message: "Loading...",
      subMessage: undefined,
      isBlocking: true,
      minVisibleMs: 400, // Longer minimum to prevent flickering
      autoProgress: true,
      deterministic: true, // Use deterministic progress
    });

    // Slightly longer delay to ensure loader is visible
    setTimeout(() => {
      router.push(typeof href === "string" ? href : (href as any).toString());
    }, 100);
  };

  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetch}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}

export default AsyncNavLink;
