"use client";
import React from "react";
import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "@/store/loaders/global-loader";

interface AsyncNavLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  loadingMessage?: string;
  [key: string]: any;
}

export function AsyncNavLink({
  children,
  href,
  className = "",
  prefetch = true,
  loadingMessage = "Loading...",
  ...props
}: AsyncNavLinkProps) {
  const router = useRouter();
  const { startLoading } = useGlobalLoader();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (props.onClick) props.onClick(e);
    if (e.defaultPrevented) return;

    startLoading({
      message: loadingMessage,
      isBlocking: false,
      minVisibleMs: 200,
    });

    // Small delay to ensure loader shows before navigation
    setTimeout(() => {
      router.push(typeof href === "string" ? href : (href as any).toString());
    }, 50);
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
