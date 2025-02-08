"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import nProgress from "nprogress";
import "nprogress/nprogress.css";
import { useEffect } from "react";
nProgress.configure({
  showSpinner: true,
  speed: 500,
  minimum: 0.3,

  template: `
       <div class="fixed top-0 left-0 w-full h-1 bg-primary/80 shadow-md shadow-primary/40" role="bar">
        <div class="nprogress-bar absolute left-0 top-0 h-full w-full bg-primary transition-all"></div>
      </div>
      <div class="spinner fixed top-2 right-4 hidden" role="spinner">
        <div class="spinner-icon w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
  `,
});
export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const _push = router.push.bind(router);

    router.push = (href, options) => {
      if (pathname !== "/") {
        nProgress.start();

        _push(href, options);
      }
    };
  }, [])

  useEffect(() => {
    nProgress.done();
  }, [pathname, searchParams, router]);

  return null;
}

