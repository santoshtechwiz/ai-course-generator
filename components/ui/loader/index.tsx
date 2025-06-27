"use client";

// Export components from the new unified loader system
export { LoaderComponent as Loader } from "./loader";
export { LoaderProvider, useLoader } from "./loader-context"; 
export { AsyncNavLink } from "./async-nav-link";
export { useAsyncWithLoader } from "./use-async-with-loader";
export { useNavigationLoader } from "./use-navigation-loader";
export { GlobalLoadingHandler } from "./global-loading-handler";
export type { LoaderProps, LoaderVariant, LoaderContext, LoaderSpeed } from "./types";
