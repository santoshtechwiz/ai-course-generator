"use client";
import React from "react";
import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useGlobalLoader } from "./global-loaders";


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
      minVisibleMs: 300,
      autoProgress: true,
    });

    // Delay slightly to let the loader show before navigation triggers
    setTimeout(() => {
      router.push(typeof href === "string" ? href : (href as any).toString());
    }, 75);
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
