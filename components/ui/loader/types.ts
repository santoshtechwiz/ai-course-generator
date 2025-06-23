export type LoaderVariant = "clip" | "beat" | "pulse" | "bar" | "scale" | "ring" | "hash" | "grid" | "sync";

export type LoaderSpeed = "slow" | "normal" | "fast";

export type LoaderContext = "quiz" | "result" | "loading" | "submitting" | "processing";

export interface LoaderProps {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
  variant?: LoaderVariant;
  showProgress?: boolean;
  progress?: number;
  speed?: LoaderSpeed;
  className?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
  context?: LoaderContext;
}
