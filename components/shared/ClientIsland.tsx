"use client";
import React, { Suspense, useEffect, useMemo } from "react";

export interface ClientIslandProps<T extends React.ComponentType<any>> {
  /** Dynamic import function. Can return the component or an object with default */
  loader: () => Promise<T> | Promise<{ default: T }>;
  /** Suspense fallback */
  fallback?: React.ReactNode;
  /** Props passed to the loaded component */
  props?: React.ComponentProps<T>;
  /** Optional error callback */
  onError?: (error: unknown) => void;
  /** Change to trigger re-load */
  retryKey?: any;
  /** Preload the module as soon as component mounts (or becomes visible in future variants) */
  prefetch?: boolean;
}

class IslandErrorBoundary extends React.Component<{ onError?: (e:unknown)=>void; children: React.ReactNode; resetSignal?: any }, { hasError: boolean; error?: unknown }> {
  constructor(props: any){
    super(props); this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown){
    return { hasError: true, error };
  }
  componentDidUpdate(prev: any){
    if (prev.resetSignal !== this.props.resetSignal && this.state.hasError){
      this.setState({ hasError: false, error: undefined });
    }
  }
  componentDidCatch(error: unknown){
    this.props.onError?.(error);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ClientIsland] error', error);
    }
  }
  reset(){ this.setState({ hasError: false, error: undefined }); }
  render(){
    if (this.state.hasError){
      return <div className="text-sm text-red-500 p-4 border rounded-md bg-destructive/10">Failed to load component. <button className="underline ml-2" onClick={()=>this.reset()}>Retry</button></div>;
    }
    return this.props.children;
  }
}

// Simple in-memory cache to avoid duplicate prefetch
const __islandPrefetchCache = new WeakSet<Function>();

export function ClientIsland<T extends React.ComponentType<any>>({ loader, fallback = null, props, onError, retryKey, prefetch }: ClientIslandProps<T>){
  // Wrap loader in React.lazy; ensure stable reference unless retryKey changes
  const LazyComp = useMemo(()=> {
    return React.lazy(async () => {
      const mod: any = await loader();
      if (mod?.default) return { default: mod.default };
      return { default: mod };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey, loader]);

  // Prefetch on mount if requested
  useEffect(() => {
    if (!prefetch) return;
    if (__islandPrefetchCache.has(loader)) return;
    loader().catch(()=>{/* ignore prefetch errors */});
    __islandPrefetchCache.add(loader);
  }, [prefetch, loader]);

  return (
    <IslandErrorBoundary onError={onError} resetSignal={retryKey}>
      <Suspense fallback={fallback}>
        <LazyComp {...(props as any)} />
      </Suspense>
    </IslandErrorBoundary>
  );
}

// Factory helper for convenience in client components
export function createIsland<T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }> | Promise<T>) {
  return function Islanded(props: React.ComponentProps<T> & { fallback?: React.ReactNode; retryKey?: any; prefetch?: boolean }) {
    return (
      <ClientIsland
        loader={importer as any}
        fallback={props.fallback}
        retryKey={props.retryKey}
        prefetch={props.prefetch}
        props={props as any}
      />
    );
  };
}
